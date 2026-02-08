
import * as router from "@parchii/router";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

import * as template from "./template.tsx";
import { rarity } from "shared/types.ts";
import { CatpageRow } from "shared/templates.tsx";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import { Miss } from "../common.ts";

const cat_view: router.Middleware<Shared, 'GET', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();

	const extract_catinst_id = ctx.url.searchParams.get('view');
	let catinst_id = null;
	if (extract_catinst_id !== null) {
		catinst_id = Number(extract_catinst_id);
	}

	const param_offset = Number(ctx.url.searchParams.get('offset') ?? "0");
	const param_query = ctx.url.searchParams.get('q') ?? "";

	let catinst = null;
	let catinst_breed = null;
	if (catinst_id !== null) {
		catinst = await ctx.data.db.catinst_get(catinst_id);
		if (catinst instanceof Miss) {
			return undefined;
		}
		if (user.id !== catinst.owner_user_id) {
			catinst = null;
		}
		else {
			catinst_breed = ctx.data.catdefs[catinst.catdef_id];
			if (catinst_breed === undefined) {
				throw new Error(`??? (${catinst})`);
			}
		}
		
	}

	const list = await ctx.data.db.catinst_list_user(user.id, 40, param_offset);
	if (list instanceof Miss) {
		return undefined;
	}

	const dom_catinst = null;dom_catinst;
	if (catinst !== null) {
		// const breed = catdefs[catinst.catdef_id];
		// dom_catinst = (
		// 	<>
		// 		<li>{ catinst.name }</li>
		// 		<li>{ breed.name } ({ breed.rarity })</li>
		// 	</>
		// );
	}

	// const a = list.values()
	// 	.map(x => {
	// 		const breed = catdefs.map[x.catdef_id];
	// 		const url = new URL(ctx.url);
	// 		url.searchParams.set('view', x.id.toString());
	// 		return <li><a href={ url.href }>{ x.name } ({ breed.name })</a></li>;
	// 	})
	// 	.toArray();
	// a;

	const input_name = catinst?.name ?? `select a cat`;
	const input_type = catinst_breed?.name ?? `—`;
	const input_id = catinst?.id.toString() ?? `—`;

	const dom = (
		<template.Base title="your cats" user={ user }>
			<template.Flash flash={ ctx.ware.flash.get() }/>

			{/* <script src="/static/script/catpage.js" defer></script> */}
			
			<div class="layout-split">
				<div class="layout-split--left">
					<div class="catpage--left--top">
						<h1>cats</h1>
						<input id="search" class="input-text catpage--left--top--search" type="search" placeholder="search cats by name or nickname..." value={ param_query }/>
					</div>

					<div id="list" class="catpage--left--list">
						{
							...list.values()
								.map(x => {
									const breed = ctx.data.catdefs[x.catdef_id];
									if (breed === undefined) {
										throw new Error(`???`);
									}
									const url = new URL(ctx.url);
									url.searchParams.set('view', x.id.toString());
									return <CatpageRow
										id={ x.id.toString() }
										name={ x.name }
										breed={ breed.name }
										rarity={ rarity[breed.rarity] }
										link={ url.href }
									/>;
								})
								.toArray()
						}
					</div>
				</div>

				<div class="layout-split--right">
					<div class="catpage--right--top">
						<div class="catpage--right--top--block">
							<div id="name_line" class="catpage--right--top--block--name_line">
								<div id="name_line_cat" class="catpage--right--top--block--name_line--name">
									{ input_name }
								</div>
								<button id="name_line_edit" class="button catpage--right--top--block--name_line--edit">edit</button>
							</div>

							<div id="name_edit" class="catpage--right--top--block--name_edit" hidden>
								<input id="name_edit_input" type="text" maxlength="24" placeholder="enter nickname..."/>
								<button id="name_edit_save" class="button" type="button">save</button>
								<button id="name_edit_cancel" class="button secondary" type="button">cancel</button>
							</div>

							<div id="meta_line" class="catpage--right--top--block--meta_line">
								type: <span id="meta_line_type">{ input_type }</span>
								<span>•</span>
								id: <span id="meta_line_id">{ input_id }</span>
							</div>
						</div>
						
						<span id="rarity_pill" class="catpage--right--top--pill pill">SRR</span>
					</div>

					<div class="catpage--right--body">
						<div class="photo catpage--right--body--photo">CAT PICTURE PLACEHOLDER</div>

						<div class="catpage--right--body--info">
							<div class="catpage--right--body--info--row">
								<div class="--key">name</div>
								<div id="value_name" class="--value">{ input_name }</div>
							</div>

							<div class="catpage--right--body--info--row">
								<div class="--key">type</div>
								<div id="value_value" class="--value">{ input_type }</div>
							</div>
						</div>

						<div id="hint" class="catpage--right--body--empty" hidden={ catinst !== null }>
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

export default {
	cat_view,
};

