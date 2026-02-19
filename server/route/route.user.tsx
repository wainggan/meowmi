import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { Shared } from "../shared.ts";
import { Miss } from "shared/utility.ts";
import link from "shared/link.ts";

import { FlashExport } from "./ware.flash.tsx";
import { ForceSessionExport, SessionExport } from "./ware.session.tsx";

import { jsx, fragment } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";
import { status_codes } from "@parchii/codes.ts";
import * as db_util from "../db/db.util.ts";
import { themes_list } from "shared/types.ts";

const view: router.Middleware<Shared, 'GET', ['username'], [SessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.session.user();
	let user_ctx = null;
	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return null;
		}

		user_ctx = db_util.user_settings_context(user, settings);
	}

	const user_view = await ctx.data.db.user_get_name(ctx.extract.username);

	let dom_inner, code: keyof typeof status_codes;

	if (user_view instanceof Miss) {
		let message;
		
		if (user_view.type === 'not_found') {
			message = `user '${ctx.extract.username}' does not exist`;
			code = 'not_found';
		}
		else {
			message = `unknown error`;
			code = 'internal_error';
		}

		dom_inner = (
			<>
				<h1>404</h1>
				<p>
					{ message }
				</p>
			</>
		);
	}
	else {
		dom_inner = (
			<>
				<h1>{ user_view.username }</h1>
				<p>
					wow!
				</p>
			</>
		);
		code = 'ok';
	}
	
	const dom = (
		<template.Base title="user" user_ctx={ user_ctx }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			{ dom_inner }
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, code, 'html');
};

const login: router.Middleware<Shared, 'GET', [], [SessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.session.user();

	if (user !== null) {
		const settings = await ctx.data.db.settings_list(user.id);
		if (settings instanceof Miss) {
			return null;
		}

		const user_ctx = db_util.user_settings_context(user, settings);

		const dom = (
			<template.Base title="login" user_ctx={ user_ctx }>
				<template.Flash flash={ ctx.ware.flash.get() }/>
				
				<div class="auth-wrap">
					<h1>login</h1>
					<p>
						you are already logged in!
					</p>
				</div>
			</template.Base>
		);

		const str = render(dom);

		return ctx.build_response(str, 'ok', 'html');
	}

	const dom = (
		<template.Base title="login" user_ctx={ user satisfies null }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<div class="auth-wrap">
				<h1>login</h1>

				<form action="" method="post" enctype="multipart/form-data">
					<input type="hidden" name="which" value="login"/>
					<input type="text" name="username"/>
					<input type="password" name="password"/>
					<button type="submit">login</button>
				</form>

				<h1>register</h1>

				<form action="" method="post" enctype="multipart/form-data">
					<input type="hidden" name="which" value="register"/>
					<input type="text" name="username"/>
					<input type="password" name="password"/>
					<input type="password" name="password-again"/>
					<button type="submit">register</button>
				</form>
			</div>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

const login_api: router.Middleware<Shared, 'POST', [], [FlashExport, SessionExport]> = async ctx => {
	const user = ctx.ware.session.user();
	if (user !== null) {
		ctx.ware.flash.set(`already logged in`, 'err');
		return ctx.build_redirect(ctx.url);
	}

	// parse form
	const form = await ctx.request.formData();

	const form_which = form.get('which');

	switch (form_which) {
		case 'login': {
			const form_username = form.get('username');
			const form_password = form.get('password');

			if (
				typeof form_username !== 'string' ||
				typeof form_password !== 'string'
			) {
				ctx.ware.flash.set(`bad form`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			const user = await ctx.data.db.user_get_name(form_username);
			if (user instanceof Miss) {
				if (user.type === 'not_found') {
					ctx.ware.flash.set(user.message, 'err');
				}
				else if (user.type === 'internal') {
					ctx.ware.flash.set(user.message, 'err');
				}
				else {
					throw user.type satisfies never;
				}

				return ctx.build_redirect(ctx.url);
			}

			const password_buffer = new TextEncoder().encode(form_password);
			const password_hash_buffer = await crypto.subtle.digest('sha-256', password_buffer);
			const password_hash = new TextDecoder().decode(password_hash_buffer);

			if (password_hash !== user.password) {
				ctx.ware.flash.set(`incorrect password`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			const session_id = await ctx.data.db.session_new(user.id, 24 * 14);
			if (session_id instanceof Miss) {
				if (session_id.type === 'internal') {
					ctx.ware.flash.set(`internal error`, 'err');
				}
				else {
					throw session_id.type satisfies never;
				}
				
				return ctx.build_redirect(ctx.url);
			}

			ctx.ware.session.set(session_id);

			// success!
			ctx.ware.flash.set(`successfully logged in!`, 'ok');
			return ctx.build_redirect(link.user_view(user.username));
		}

		case 'register': {
			let form_username = form.get('username');
			const form_password = form.get('password');
			const form_password_again = form.get('password-again');

			if (
				typeof form_username !== 'string' ||
				typeof form_password !== 'string' ||
				typeof form_password_again !== 'string'
			) {
				ctx.ware.flash.set(`bad form`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			form_username = form_username.trim();

			if (form_username.length < 4) {
				ctx.ware.flash.set(`username must be 4 characters or longer`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			if (form_password.length < 8) {
				ctx.ware.flash.set(`password must be 8 characters or longer`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			if (form_password !== form_password_again) {
				ctx.ware.flash.set(`passwords do not match`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			const password_buffer = new TextEncoder().encode(form_password);
			const password_hash_buffer = await crypto.subtle.digest('sha-256', password_buffer);
			const password_hash = new TextDecoder().decode(password_hash_buffer);

			// const settings = db_util.user_settings_pack(db_util.user_settings_default());

			const user_id = await ctx.data.db.user_new(form_username, password_hash);
			if (user_id instanceof Miss) {
				if (user_id.type === 'exists') {
					ctx.ware.flash.set(`username '${form_username}' already exists.`, 'err');
				}
				else if (user_id.type === 'internal') {
					ctx.ware.flash.set(`internal error`, 'err');
				}
				else {
					throw user_id.type satisfies never;
				}

				return ctx.build_redirect(ctx.url);
			}

			for (const [key, value] of Object.entries(db_util.user_settings_default())) {
				const result = await ctx.data.db.settings_get(user_id, key, value);
				if (result instanceof Miss) {
					if (result.type === 'internal') {
						ctx.ware.flash.set(`internal error`, 'err');
					}
					else {
						throw result.type satisfies never;
					}

					return ctx.build_redirect(ctx.url);
				}
			}

			ctx.ware.flash.set(`successfully created account. please log in.`, 'ok');
			return ctx.build_redirect(ctx.url);
		}
	}

	ctx.ware.flash.set(`bad form`, 'err');
	return ctx.build_redirect(ctx.url);
};

const logout: router.Middleware<Shared, 'GET', [], [SessionExport]> = async ctx => {
	ctx.ware.session.logout();
	
	const dom = (
		<template.Base title="logout" user_ctx={ null }>
			<h1>logout</h1>
			<p>
				you have been logged out.
			</p>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

const settings: router.Middleware<Shared, 'GET', [], [ForceSessionExport, FlashExport]> = async ctx => {
	const user = ctx.ware.force_session.user();

	const settings = await ctx.data.db.settings_list(user.id);
	if (settings instanceof Miss) {
		return null;
	}

	const user_ctx = db_util.user_settings_context(user, settings);

	const dom = (
		<template.Base title="login" user_ctx={ user_ctx }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<div class="auth-wrap">
				<h1>settings</h1>

				<h2>profile</h2>

				<form action="" method="post" enctype="multipart/form-data">
					<input type="hidden" name="which" value="profile"/>

					<select name="theme">
						{
							...themes_list.map(x => <option value={ x } selected={ x === user_ctx.settings['theme'] }>{ x }</option>)
						}
					</select>
					
					<button type="submit">submit</button>
				</form>

				<h2>account</h2>

				<form action="" method="post" enctype="multipart/form-data">
					<input type="hidden" name="which" value="account"/>

					<input type="text" name="username"/>
					
					<input type="password" name="password"/>
					<input type="password" name="password-again"/>
					
					<button type="submit">submit</button>
				</form>
			</div>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

const settings_api: router.Middleware<Shared, 'POST', never, [FlashExport, ForceSessionExport]> = async ctx => {
	const user = ctx.ware.force_session.user();

	// parse form
	const form = await ctx.request.formData();

	const form_which = form.get('which');

	switch (form_which) {
		case 'profile': {
			const form_theme = form.get('theme');

			if (typeof form_theme !== 'string') {
				ctx.ware.flash.set(`bad form`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			if (!db_util.settings_theme_check(form_theme)) {
				ctx.ware.flash.set(`invalid theme`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			await ctx.data.db.settings_set(user.id, 'theme', form_theme);

			const result = await ctx.data.db.user_set(user);
			if (result instanceof Miss) {
				ctx.ware.flash.set(`unknown internal error`, 'err');
				return ctx.build_redirect(ctx.url);
			}

			ctx.ware.flash.set(`successfully updated profile settings!`, 'ok');
			return ctx.build_redirect(ctx.url);
		}
	}

	ctx.ware.flash.set(`bad form`, 'err');
	return ctx.build_redirect(ctx.url);
};

export default {
	view,
	login,
	login_api,
	logout,
	settings,
	settings_api,
};

