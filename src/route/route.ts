/*
gathers together all our middleware and exports a `Router`.
*/

import * as router from "@parchii/router";
import { Shared } from "../shared.ts";

import route_error from "./route.error.tsx";
import route_index from "./route.index.tsx";
import route_user from "./route.user.tsx";
import route_gacha from "./route.gacha.tsx";
import route_cat from "./route.cat.tsx";

import { flash_middleware } from "./util.flash.tsx";
import { force_session_middleware, session_middleware } from "./util.session.tsx";

const route = new router.Router<Shared>();

route.set_404(route_error.not_found);

route.set_static(async ctx => {
	const parts = "./" + ctx.url_parts.slice(1).join("/");

	const ext = ctx.url_parts.at(-1)?.split(".").at(-1);
	if (ext === undefined || !(ext in router.content_type_codes)) {
		return undefined;
	}

	let file;
	try {
		file = await Deno.readFile(parts);
	}
	catch (_e) {
		return undefined;
	}

	return ctx.build_response(file, 'ok', ext as keyof typeof router.content_type_codes);
});

route.get("/ping", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

route.get("/unauthorized", route_error.unauthorized);

route.get("/", route_index.index);

route.get("/user/:username", flash_middleware, route_user.view);

route.get("/login", flash_middleware, route_user.login);
route.post("/login", session_middleware, flash_middleware, route_user.login_api);

route.get("/gacha", session_middleware, flash_middleware, route_gacha.gacha);
route.post("/gacha", session_middleware, flash_middleware, route_gacha.gacha_api);

route.get("/cat", session_middleware, force_session_middleware, flash_middleware, route_cat.cat_list);
route.get("/cat/:id", session_middleware, force_session_middleware, flash_middleware, route_cat.cat_view);

export default route;

