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
import api from "../api.ts";

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



