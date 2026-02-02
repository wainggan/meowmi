/*
gathers together all our middleware and exports a `Router`.
*/

import * as router from "@parchii/router";
import { Shared } from "../shared.ts";

import route_index from "./route.index.tsx";
import route_user from "./route.user.tsx";

import { flash_middleware } from "./util.flash.tsx";

const route = new router.Router<Shared>();

route.set_static(async ctx => {
	const parts = "./" + ctx.url_parts.slice(1).join("/");

	const ext = ctx.url_parts.at(-1)?.split(".").at(-1);
	if (ext === undefined || !(ext in router.content_type_codes)) {
		return ctx.build_response(`404`, 'not_found', 'txt');
	}

	let file;
	try {
		file = await Deno.readFile(parts);
	}
	catch (_e) {
		return ctx.build_response(`404`, 'not_found', 'txt');
	}

	return ctx.build_response(file, 'ok', ext as keyof typeof router.content_type_codes);
});

route.get("/ping", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

route.get("/", route_index.index);

route.get("/user/:username", flash_middleware, route_user.view);

route.get("/login", flash_middleware, route_user.login);
route.post("/login", flash_middleware, route_user.login_api);

export default route;

