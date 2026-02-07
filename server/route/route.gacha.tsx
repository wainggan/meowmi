/*
page used for gacha.
*/

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import * as catdefs_util from "../db/catdefs.util.ts";
import { Miss } from "../common.ts";
import catloot from "shared/data.loot.ts";

const gacha: router.Middleware<{}, 'GET', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();
	const session = ctx.ware.force_session.session();

	const dom = (
		<template.Base title="index" user={ user }>
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

const gacha_api: router.Middleware<Shared, 'POST', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();

	if (user.tokens <= 0) {
		ctx.ware.flash.set(`you don't have enough tokens!`, 'err');
		return ctx.build_redirect(ctx.url);
	}

	const breed = catdefs_util.select(ctx.data.catdefs, catloot.base);

	const catinst_id = await ctx.data.db.catinst_add(breed.id, user.id);
	if (catinst_id instanceof Miss) {
		if (catinst_id.type === 'not_found') {
			ctx.ware.flash.set(`user no longer exists (???)`, 'err');
		}
		else if (catinst_id.type === 'internal') {
			ctx.ware.flash.set(`unknown internal error`, 'err');
		}
		else {
			throw catinst_id.type satisfies never;
		}

		return ctx.build_redirect(ctx.url);
	}

	user.tokens = Math.max(user.tokens - 1, 0);

	const result_update = await ctx.data.db.user_set(user);
	if (result_update instanceof Miss) {
		ctx.ware.flash.set(`unknown internal error`, 'err');
		return ctx.build_redirect(ctx.url);
	}

	return ctx.build_redirect(`/cat?view=${catinst_id}`);
};

export default {
	gacha,
	gacha_api,
};



