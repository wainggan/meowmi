/*
page used fir gacha.
*/

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx, fragment } from "@parchii/jsx";
import { render } from "@parchii/html";

import { FlashExport } from "./util.flash.tsx";
import { SessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import catdefs from "../db/catdefs.ts";
import { Miss } from "../common.ts";

const gacha: router.Middleware<{}, 'GET', never, SessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.session.user();
	const session = ctx.ware.session.session();

	let dom_inner;
	if (user !== null && session !== null) {
		dom_inner = (
			<>
				<div>
					you have { user.tokens } tokens.
				</div>
				
				<form action="" method="post" enctype="application/x-www-form-urlencoded">
					<input type="hidden" name="csrf" value={ session.csrf }/>
					<button type="submit">roll (-1 token)</button>
				</form>
			</>
		);
	}
	else {
		dom_inner = (
			<div>
				you must be logged in to roll.
			</div>
		);
	}

	const dom = (
		<template.Base title="index">
			<template.Flash message={ ctx.ware.flash.get() }/>
			
			<h1>gacha</h1>
			
			{ dom_inner }
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

const gacha_api: router.Middleware<Shared, 'POST', never, SessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.session.user();
	const session = ctx.ware.session.session();

	if (user === null || session === null) {
		ctx.ware.flash.set(`you are not logged in.`);
		return ctx.build_redirect(ctx.url);
	}

	if (user.tokens <= 0) {
		ctx.ware.flash.set(`you don't have enough tokens!`);
		return ctx.build_redirect(ctx.url);
	}

	const breed = catdefs.keys[Math.random() * catdefs.keys.length | 0];
	if (breed === undefined) {
		throw new Error(`idk`);
	}

	const catinst_id = await ctx.data.db.catinst_add(breed, user.id);
	if (catinst_id instanceof Miss) {
		if (catinst_id.type === 'not_found') {
			ctx.ware.flash.set(`user no longer exists (???)`);
		}
		else if (catinst_id.type === 'internal') {
			ctx.ware.flash.set(`unknown internal error`);
		}
		else {
			throw catinst_id.type satisfies never;
		}

		return ctx.build_redirect(ctx.url);
	}

	user.tokens = Math.max(user.tokens - 1, 0);

	const result_update = await ctx.data.db.user_set(user);
	if (result_update instanceof Miss) {
		ctx.ware.flash.set(`unknown internal error`);
		return ctx.build_redirect(ctx.url);
	}

	return ctx.build_redirect(`/cat/${catinst_id}`);
};

export default {
	gacha,
	gacha_api,
};



