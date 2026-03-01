/*
page used for gacha.
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";

import { FlashExport } from "./ware.flash.tsx";
import { ForceSessionExport } from "./ware.forcesession.tsx";
import { Shared } from "../shared.ts";
import { Miss } from "shared/utility.ts";
import * as db_util from "../db/db.util.ts";

const notifications: router.Middleware<Shared, 'GET', [], [ForceSessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.force_session.user();
	const session = ctx.ware.force_session.session();

	const user_ctx = await db_util.user_context(ctx.data, user);
	if (user_ctx instanceof Miss) {
		return null;
	}

	const dom = (
		<template.Base title="index" user_ctx={ user_ctx }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<h1>notifications</h1>
			
			{
				<ul>
					{
						...user_ctx.notifications.map(x => <li>{ x.content } <button form="form" type="submit" name="id" value={ x.id.toString() }>delete</button></li>)
					}
				</ul>
			}
			
			<form id="form" action="" method="post" enctype="application/x-www-form-urlencoded">
				<input type="hidden" name="csrf" value={ session.csrf }/>
			</form>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

const notifications_api: router.Middleware<Shared, 'POST', [], [ForceSessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.force_session.user();

	const formdata = await ctx.request.formData();

	const input_id = formdata.get('id');
	if (typeof input_id !== 'string') {
		ctx.ware.flash.set(`invalid form`, 'err');
		return ctx.build_redirect(ctx.url);
	}

	const id = Number(input_id);

	const notif = await ctx.data.db.notification_get(id);
	if (notif instanceof Miss) {
		ctx.ware.flash.set(notif.message, 'err');
		return ctx.build_redirect(ctx.url);
	}

	if (notif.user_id !== user.id) {
		ctx.ware.flash.set(`nice try`, 'err');
		return ctx.build_redirect(ctx.url);
	}

	const result = await ctx.data.db.notification_delete(notif.id);
	if (result instanceof Miss) {
		ctx.ware.flash.set(result.message, 'err');
		return ctx.build_redirect(ctx.url);
	}

	return ctx.build_redirect(ctx.url);
};

export default {
	notifications,
	notifications_api,
} as const;

