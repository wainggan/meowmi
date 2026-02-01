
import { TextEncoder } from "node:util";
import * as std_cookie from "@std/http/cookie";

import * as router from "@parchii/router";

import { Shared } from "../shared.ts";

export type FlashExport = {
	flash: {
		readonly get: () => string | null;
		readonly set: (message: string) => void;
	};
};

export const flash_middleware: router.Middleware<Shared, router.Method, string, {}, FlashExport> = async ctx => {
	const state: {
		message: string | null;
		consumed: boolean;
		outgoing: string | null;
	} = {
		message: null,
		consumed: false,
		outgoing: null,
	};
	
	const cookies = std_cookie.getCookies(ctx.request.headers);
	if ('flash' in cookies) {
		const base64 = cookies['flash'];
		const buffer = Uint8Array.fromBase64(base64);
		state.message = new TextDecoder().decode(buffer);
	}

	ctx.ware.flash = {
		get() {
			if (state.message !== null) {
				state.consumed = true;
				return state.message;
			}
			return null;
		},
		set(message) {
			state.outgoing = message;
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
		const buffer = new TextEncoder().encode(state.outgoing);
		std_cookie.setCookie(response.headers, {
			name: 'flash',
			value: buffer.toBase64(),
			path: '/',
		});
	}

	return response;
};

