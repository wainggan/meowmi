/*
404!
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { SessionExport } from "./ware.session.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";
import { Miss } from "shared/utility.ts";
import { Shared } from "../shared.ts";
import * as db_util from "../db/db.util.ts";

const not_found_signal = Symbol('not_found');

export type ErrorNotFoundExport = {
	error_not_found: {
		signal(): router.Signal;
	};
};

const not_found: router.Middleware<Shared, router.Method, [], [SessionExport], [ErrorNotFoundExport]> = async ctx => {
	ctx.ware.error_not_found = {
		signal() {
			return {
				[not_found_signal]: 0,
			};
		},
	};

	const response = await ctx.next();

	if (response instanceof Response) {
		return response;
	}
	else if (response !== null && !(not_found_signal in response)) {
		return response;
	}
	
	const user = ctx.ware.session.user();
	let user_ctx = null;
	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return null;
		}

		user_ctx = db_util.user_settings_context(user, settings);
	}

	const dom = (
		<template.Base title="index" user_ctx={ user_ctx }>
			<h1>404</h1>
			<p>
				not found!
			</p>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'not_found', 'html');
};

const unauthorized_signal = Symbol('unauthorized');

export type ErrorUnauthorizedExport = {
	error_unauthorized: {
		signal(): router.Signal;
	};
};

const unauthorized: router.Middleware<Shared, router.Method, [], [SessionExport], [ErrorUnauthorizedExport]> = async ctx => {
	ctx.ware.error_unauthorized = {
		signal() {
			return {
				[unauthorized_signal]: 0,
			};
		},
	};

	const response = await ctx.next();

	if (response === null) {
		return response;
	}
	else if (response instanceof Response) {
		return response;
	}
	else if (!(unauthorized_signal in response)) {
		return response;
	}

	const user = ctx.ware.session.user();
	let user_ctx = null;
	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return null;
		}

		user_ctx = db_util.user_settings_context(user, settings);
	}

	const dom = (
		<template.Base title="index" user_ctx={ user_ctx }>
			<h1>unauthorized</h1>
			<p>
				you are not authorized to see that page.
				{ user === null ? 'perhaps you are not logged in?' : '' }
			</p>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'unauthorized', 'html');
};

export default {
	not_found,
	unauthorized,
};

