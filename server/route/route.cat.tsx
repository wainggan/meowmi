
import * as router from "@parchii/router";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

import * as template from "./template.tsx";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport, SessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import { Miss } from "../common.ts";

const cat_view: router.Middleware<Shared, 'GET', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();

	const extract_catinst_id = ctx.url.searchParams.get('view');
	let catinst_id = null;
	if (extract_catinst_id !== null) {
		catinst_id = Number(extract_catinst_id);
	}
	catinst_id;

	const param_offset = Number(ctx.url.searchParams.get('offset') ?? "0");
	param_offset;
	const param_query = ctx.url.searchParams.get('q') ?? "";

	const dom = (
		<template.Base title="your cats" user={ user }>
			<template.Flash flash={ ctx.ware.flash.get() }/>

			<script src="/static/script/catpage.js" defer></script>
			
			<div class="layout-split">
				<div class="layout-split--left">
					<div class="catpage--left--top">
						<h1>cats</h1>
						<input id="search" class="input-text catpage--left--top--search" type="search" placeholder="search cats by name or nickname..." value={ param_query }/>
						<button id="search_button" class="button catpage--right--top--button">search</button>
					</div>

					<div id="list" class="catpage--left--list">
					</div>
				</div>

				<div class="layout-split--right">
					<div class="catpage--right--top">
						<div class="catpage--right--top--block">
							<div id="name_line" class="catpage--right--top--block--name_line">
								<h2 id="name_line_cat" class="catpage--right--top--block--name_line--name"></h2>
								<button id="name_line_edit" class="button catpage--right--top--block--name_line--edit">edit</button>
							</div>

							<div id="name_edit" class="catpage--right--top--block--name_edit" hidden>
								<input id="name_edit_input" type="text" maxlength="24" placeholder="enter nickname..."/>
								<button id="name_edit_save" class="button" type="button">save</button>
								<button id="name_edit_cancel" class="button secondary" type="button">cancel</button>
							</div>

							<div id="meta_line" class="catpage--right--top--block--meta_line">
								type: <span id="meta_line_type"></span>
								<span>•</span>
								id: <span id="meta_line_id"></span>
							</div>
						</div>
						
						<span id="rarity_pill" class="catpage--right--top--pill pill"></span>
					</div>

					<div class="catpage--right--body">
						<div class="photo catpage--right--body--photo">CAT PICTURE PLACEHOLDER</div>

						<div class="catpage--right--body--info">
							<div class="catpage--right--body--info--row">
								<div class="--key">name</div>
								<div id="value_name" class="--value"></div>
							</div>

							<div class="catpage--right--body--info--row">
								<div class="--key">type</div>
								<div id="value_type" class="--value"></div>
							</div>
						</div>

						<div id="hint" class="catpage--right--body--empty">
							click a cat on the left to open the viewer.
						</div>
					</div>
				</div>
			</div>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

const api_cat_list: router.Middleware<Shared, 'GET', never, SessionExport> = async ctx => {
	let output_json;
	let output_code: router.StatusNames;

	exit: {
		const user = ctx.ware.session.user();
		if (user === null) {
			output_code = 'unauthorized';
			output_json = {
				status: 'err',
				code: output_code,
				message: `missing session cookie`,
			};
			break exit;
		}

		const form_query = ctx.url.searchParams.get('query') ?? '';
		const form_offset = ctx.url.searchParams.get('offset') ?? '0';
		const form_limit = ctx.url.searchParams.get('limit') ?? '20';

		if (
			typeof form_query !== 'string' ||
			typeof form_offset !== 'string' ||
			typeof form_limit !== 'string'
		) {
			output_code = 'bad_request';
			output_json = {
				status: 'err',
				code: output_code,
				message: `invalid form data`,
			};
			break exit;
		}

		const input_limit = Math.min(Math.max(Number(form_limit), 0), 40);
		const input_offset = Math.max(Number(form_offset), 0);

		const list = await ctx.data.db.catinst_list_user(user.id, form_query, input_limit, input_offset);
		if (list instanceof Miss) {
			output_code = 'internal_error';
			output_json = {
				status: 'err',
				code: output_code,
				message: `internal error`,
			};
			break exit;
		}

		const mapped = list.values()
			.map(x => {
				return {
					inst: x,
					def: ctx.data.catdefs[x.catdef_id],
				};
			})
			.toArray();

		output_code = 'ok'
		output_json = {
			status: 'ok',
			list: mapped
		};
	}

	const str = JSON.stringify(output_json);
	
	return ctx.build_response(str, output_code, 'json');
};

const api_cat_update: router.Middleware<Shared, 'POST', never, SessionExport> = async ctx => {
	const form = await ctx.request.formData();

	let output_json;
	let output_code: router.StatusNames;

	exit: {
		const user = ctx.ware.session.user();
		if (user === null) {
			output_code = 'unauthorized';
			output_json = {
				status: 'err',
				code: output_code,
				message: `missing session cookie`,
			};
			break exit;
		}

		const form_id = form.get('id');
		const form_name = form.get('name');
		if (
			typeof form_id !== 'string' ||
			typeof form_name !== 'string'
		) {
			output_code = 'bad_request';
			output_json = {
				status: 'err',
				code: output_code,
				message: `invalid form data`,
			};
			break exit;
		}

		const catinst = await ctx.data.db.catinst_get(Number(form_id));
		if (catinst instanceof Miss) {
			output_code = 'internal_error';
			output_json = {
				status: 'err',
				code: output_code,
				message: catinst.toString(),
			};
			break exit;
		}

		catinst.name = form_name.trim();

		const result = await ctx.data.db.catinst_set(catinst);
		if (result instanceof Miss) {
			output_code = 'internal_error';
			output_json = {
				status: 'err',
				code: output_code,
				message: catinst.toString(),
			};
			break exit;
		}

		output_code = 'ok';
		output_json = {
			status: 'ok',
		};
		break exit;
	}

	const str = JSON.stringify(output_json);

	return ctx.build_response(str, output_code, 'json');
};

export default {
	cat_view,
	api_cat_list,
	api_cat_update,
};

