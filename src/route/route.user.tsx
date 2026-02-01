

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { Shared } from "../shared.ts";
import { Miss } from "../common.ts";

import { FlashExport } from "./util.flash.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

const login: router.Middleware<Shared, 'GET', never, FlashExport> = async ctx => {
	const dom = (
		<template.Base title="login">
			<h1>login</h1>

			<template.Flash message={ ctx.ware.flash.get() }/>

			<form action="" method="post" enctype="multipart/form-data">
				<input type="text" name="username"/>
				<input type="password" name="password"/>
				<button type="submit">login</button>
			</form>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

const login_api: router.Middleware<Shared, 'POST', never, FlashExport> = async ctx => {
	// parse form
	const form = await ctx.request.formData();

	const form_username = form.get('username');
	const form_password = form.get('password');

	if (
		typeof form_username !== 'string' ||
		typeof form_password !== 'string'
	) {
		ctx.ware.flash.set(`bad form`);
		return ctx.build_redirect(ctx.url);
	}

	const user = await ctx.data.db.users_get(form_username);
	if (user instanceof Miss) {
		if (user.type === 'not_found') {
			ctx.ware.flash.set(`user '${form_username}' does not exist`);
		}
		else if (user.type === 'internal') {
			ctx.ware.flash.set(`unknown error`);
		}

		return ctx.build_redirect(ctx.url);
	}

	// success!
	ctx.ware.flash.set(`success`);
	return ctx.build_redirect(ctx.url);
};

export default {
	login,
	login_api,
};

