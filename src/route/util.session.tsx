
import * as router from "@parchii/router";
import { Session, User } from "../db/db.types.ts";
import { Miss } from "../common.ts";

import { jsx } from "@parchii/jsx";
import * as template from "./template.tsx";

import * as std_cookie from "@std/http/cookie";
import { Shared } from "../shared.ts";
import { render } from "@parchii/html";

export type SessionExport = {
	session: {
		readonly user: () => User | null;
		readonly session: () => Session | null;
		readonly set: (session_id: string) => void;
		readonly logout: () => void;
	};
};

export type ForceSessionExport = {
	force_session: {
		readonly user: () => User;
		readonly session: () => Session;
	};
};

export const session_middleware: router.Middleware<Shared, router.Method, never, {}, SessionExport> = async ctx => {
	const state: {
		session_id: null | string;
		session_id_new: null | string;
		session_id_invalid: boolean;
		session_id_logout: boolean;
		user: null | User;
		session: null | Session;
	} = {
		session_id: null,
		session_id_new: null,
		session_id_invalid: false,
		session_id_logout: false,
		user: null,
		session: null,
	};

	const cookies = std_cookie.getCookies(ctx.request.headers);
	if ('session' in cookies) {
		const base64 = cookies['session'];
		const buffer = Uint8Array.fromBase64(base64);
		state.session_id = new TextDecoder().decode(buffer);
	}

	if (state.session_id !== null) {
		const session = await ctx.data.db.session_get(state.session_id);
		if (session instanceof Miss) {
			state.session_id_invalid = true;
		}
		else {
			const user = await ctx.data.db.user_get_id(session.user_id);
			if (user instanceof Miss) {
				state.session_id_invalid = true;
			}
			else {
				state.user = user;
				state.session = session;
			}
		}
	}

	ctx.ware.session = {
		user() {
			return state.user;
		},
		session() {
			return state.session;
		},
		set(session_id) {
			state.session_id_new = session_id;
		},
		logout() {
			state.session_id_logout = true;
		}
	};

	const response = await ctx.next();
	if (response === undefined) {
		return undefined;
	}

	if (state.session_id_new !== null) {
		const buffer = new TextEncoder().encode(state.session_id_new);
		std_cookie.setCookie(response.headers, {
			name: 'session',
			value: buffer.toBase64(),
			path: '/',
			httpOnly: true,
			sameSite: 'Lax',
			// 14 days
			maxAge: 60 * 60 * 60 * 24 * 14,
			secure: true,
		});
	}
	else if (state.session_id !== null) {
		if (state.session_id_logout) {
			await ctx.data.db.session_delete(state.session_id);
		}

		if (state.session_id_invalid) {
			std_cookie.deleteCookie(response.headers, 'session', {
				path: '/',
				httpOnly: true,
				secure: true,
			});
		}
	}

	return response;
};

export const force_session_middleware: router.Middleware<Shared, router.Method, never, SessionExport, ForceSessionExport> = async ctx => {
	const user = ctx.ware.session.user();
	const session = ctx.ware.session.session();

	if (user === null || session === null) {
		const dom = (
			<template.Base title="error">
				<h1>error</h1>
				<p>
					you must be logged in to see this.
				</p>
			</template.Base>
		);

		const str = render(dom);

		return ctx.build_response(str, 'unauthorized', 'html');
	}

	ctx.ware.force_session = {
		user() {
			return user;
		},
		session() {
			return session;
		}
	};

	const response = await ctx.next();

	return response;
};

