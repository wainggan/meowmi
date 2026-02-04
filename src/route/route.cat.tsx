
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

	let dom_catinst = null;
	if (catinst !== null) {
		const breed = catdefs.map[catinst.catdef_id];
		dom_catinst = (
			<>
				<li>{ catinst.name }</li>
				<li>{ breed.name } ({ breed.rarity })</li>
			</>
		);
	}	

	const dom = (
		<template.Base title="your cats" user={ user }>
			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<h1>cat</h1>
			
			<ul>
				{ dom_catinst }
			</ul>

			<ul>
				{
					...list.values()
						.map(x => {
							const breed = catdefs.map[x.catdef_id];
							const url = new URL(ctx.url);
							url.searchParams.set('view', x.id.toString());
							return <li><a href={ url.href }>{ x.name } ({ breed.name })</a></li>;
						})
						.toArray()
				}
			</ul>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

export default {
	cat_view,
};

