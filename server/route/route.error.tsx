/*
404!
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { SessionExport } from "./util.session.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";
import { Miss } from "shared/utility.ts";
import { Shared } from "../shared.ts";
import * as db_util from "../db/db.util.ts";

const not_found: router.Middleware<Shared, router.Method, [], [SessionExport]> = async ctx => {
	const user = ctx.ware.session.user();
	let user_ctx = null;
	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return undefined;
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

const unauthorized: router.Middleware<Shared, router.Method, [], [SessionExport]> = async ctx => {
	const user = ctx.ware.session.user();
	let user_ctx = null;
	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return undefined;
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

