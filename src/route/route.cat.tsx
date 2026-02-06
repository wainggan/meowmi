
import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx, fragment } from "@parchii/jsx";
import { render } from "@parchii/html";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import { Miss } from "../common.ts";
import catdefs from "../db/catdefs.data.ts";

const cat_view: router.Middleware<Shared, 'GET', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();

	const extract_catinst_id = ctx.url.searchParams.get('view');
	let catinst_id = null;
	if (extract_catinst_id !== null) {
		catinst_id = Number(extract_catinst_id);
	}

	let catinst = null;
	if (catinst_id !== null) {
		catinst = await ctx.data.db.catinst_get(catinst_id);
		if (catinst instanceof Miss) {
			return undefined;
		}
		if (user.id !== catinst.owner_user_id) {
			catinst = null;
		}
	}

	const list = await ctx.data.db.catinst_list_user(user.id, 40, 0);
	if (list instanceof Miss) {
		return undefined;
	}

	let dom_catinst = null;dom_catinst;
	if (catinst !== null) {
		const breed = catdefs.map[catinst.catdef_id];
		dom_catinst = (
			<>
				<li>{ catinst.name }</li>
				<li>{ breed.name } ({ breed.rarity })</li>
			</>
		);
	}	

	const a = list.values()
		.map(x => {
			const breed = catdefs.map[x.catdef_id];
			const url = new URL(ctx.url);
			url.searchParams.set('view', x.id.toString());
			return <li><a href={ url.href }>{ x.name } ({ breed.name })</a></li>;
		})
		.toArray();
	a;

	const dom = (
		<template.Base title="your cats" user={ user }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<div class="layout-split">
				<div class="layout-split--left">
					<div class="catpage--left--top">
						<h1>cats</h1>
						<input id="search" class="input-text catpage--left--top--search" type="search" placeholder="search cats by name or nickname..."/>
					</div>
				</div>

				<div class="layout-split--right">
					<div class="catpage--right--top">
						<div class="catpage--right--top--block">
							<div class="catpage--right--top--block--name_line">
								<div class="catpage--right--top--block--name_line--name">
									select a cat
								</div>
								<button id="name_line" class="button catpage--right--top--block--name_line--edit">nickname</button>
							</div>

							<div class="catpage--right--top--block--name_edit" hidden>
								<input id="name_edit_input" type="text" maxlength="24" placeholder="enter nickname..."/>
								<button id="name_edit_save" class="button" type="button">save</button>
								<button id="name_edit_cancel" class="button secondary" type="button">cancel</button>
							</div>

							<div id="meta_line" class="catpage--right--top--block--meta_line">
								<span id="meta_line_text_type">type: —</span>
								<span>•</span>
								<span id="meta_line_text_id">id: —</span>
							</div>
						</div>
						
						<span id="rarity_pill" class="catpage--right--top--pill pill">SRR</span>
					</div>

					<div class="catpage--right--body">
						<div class="photo catpage--right--body--photo">CAT PICTURE PLACEHOLDER</div>

						<div class="catpage--right--body--info">
							<div class="catpage--right--body--info--row">
								<div class="catpage--right--body--info--row--key">name</div>
								<div id="value_name" class="catpage--right--body--info--row--value">-</div>
							</div>

							<div class="catpage--right--body--info--row">
								<div class="catpage--right--body--info--row--key">nickname</div>
								<div id="value_nick" class="catpage--right--body--info--row--value">-</div>
							</div>

							<div class="catpage--right--body--info--row">
								<div class="catpage--right--body--info--row--key">type</div>
								<div id="value_value" class="catpage--right--body--info--row--value">-</div>
							</div>
						</div>


					</div>
				</div>
			</div>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

export default {
	cat_view,
};

