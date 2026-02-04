
import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

import { FlashExport } from "./util.flash.tsx";
import { ForceSessionExport } from "./util.session.tsx";
import { Shared } from "../shared.ts";
import { Miss } from "../common.ts";
import catdefs from "../db/catdefs.data.ts";

const cat_list: router.Middleware<Shared, 'GET', never, ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();
	
	const list = await ctx.data.db.catinst_list_user(user.id, 40, 0);
	if (list instanceof Miss) {
		return undefined;
	}
	
	const dom = (
		<template.Base title="your cats">
			<h1>cats</h1>

			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<ul>
				{
					...list.values()
						.map(x => <li><a href={ `/cat/${x.id}` }>{ x.id }</a></li>)
						.toArray()
				}
			</ul>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

const cat_view: router.Middleware<Shared, 'GET', 'id', ForceSessionExport & FlashExport> = async ctx => {
	const user = ctx.ware.force_session.user();
	
	const catinst = await ctx.data.db.catinst_get(Number(ctx.extract.id));
	if (catinst instanceof Miss) {
		return undefined;
	}

	if (user.id !== catinst.owner_user_id) {
		return undefined;
	}

	const breed = catdefs.map[catinst.catdef_id];

	const dom = (
		<template.Base title="your cats">
			<h1>cat</h1>

			<template.Flash flash={ ctx.ware.flash.get() }/>
			
			<p>
				{ breed.name } ({ breed.rarity })
			</p>
		</template.Base>
	);

	const str = render(dom);

	return ctx.build_response(str, 'ok', 'html');
};

export default {
	cat_list,
	cat_view,
};

