/*
page used for gacha.
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import api from "../api.ts";
import { Miss } from "shared/utility.ts";
import * as db_util from "../db/db.util.ts";

const gacha: router.Middleware<Shared, 'GET', [], [ForceSessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.force_session.user();
	const session = ctx.ware.force_session.session();

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
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<h1>gacha</h1>
			
			<div>
				you have { user.tokens } tokens.
			</div>
			
			<form action="" method="post" enctype="application/x-www-form-urlencoded">
				<input type="hidden" name="csrf" value={ session.csrf }/>
				<button type="submit">roll (-1 token)</button>
			</form>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

const gacha_api: router.Middleware<Shared, 'POST', [], [ForceSessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.force_session.user();

	const result = await api.gacha_pull(ctx.data, user, {});

	if (result.status === 'err') {
		ctx.ware.flash.set(result.message, 'err');
		return ctx.build_redirect(ctx.url);
	}
	else {
		return ctx.build_redirect(`/cat?view=${result.pull.toString()}`);
	}
};

export default {
	gacha,
	gacha_api,
};



