
import { TextEncoder } from "node:util";
import * as std_cookie from "@std/http/cookie";

import * as router from "@parchii/router.ts";

import { Shared } from "../shared.ts";

type FlashMessage = {
	message: string;
	mood: 'ok' | 'err';
};

export type FlashExport = {
	signal: never;
	ware: {
		flash: {
			readonly get: () => { message: string, mood: 'ok' | 'err' } | null;
			readonly set: (message: string, mood: 'ok' | 'err') => void;
		};
	};
};

export const flash_middleware: router.Middleware<Shared, router.Method, [], [], [FlashExport]> = async ctx => {
	const state: {
		consumed: boolean;
		message: FlashMessage | null;
		outgoing: FlashMessage | null;
	} = {
		consumed: false,
		message: null,
		outgoing: null,
	};
	
	const cookies = std_cookie.getCookies(ctx.request.headers);
	if ('flash' in cookies) {
		const base64 = cookies['flash'];
		const buffer = Uint8Array.fromBase64(base64);
		const str = new TextDecoder().decode(buffer);
		const split = str.split('|');
		if (split.length === 2 && (split[1] === 'ok' || split[1] === 'err')) {
			state.message = {
				message: split[0],
				mood: split[1],
			};
		}
	}

	ctx.ware.flash = {
		get() {
			if (state.message !== null) {
				state.consumed = true;
				return state.message;
			}
			return null;
		},
		set(message, mood) {
			state.outgoing = {
				message,
				mood,
			};
		},
	};
	
	const response = await ctx.next();
	if (response === undefined) {
		return undefined;
	}

	if (state.consumed) {
		std_cookie.deleteCookie(response.headers, 'flash', {
			path: '/',
		});
	}

	if (state.outgoing !== null) {
		const str = `${state.outgoing.message}|${state.outgoing.mood}`;
		const buffer = new TextEncoder().encode(str);
		std_cookie.setCookie(response.headers, {
			name: 'flash',
			value: buffer.toBase64(),
			path: '/',
		});
	}

	return response;
};

