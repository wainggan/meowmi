/*
gathers together all our middleware and exports a `Router`.
*/

import * as router from "@parchii/router";
import { Shared } from "../shared.ts";

import route_index from "./route.index.tsx";
import route_user from "./route.user.tsx";

import { flash_middleware } from "./util.flash.tsx";

const route = new router.Router<Shared>();

route.get("/ping", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

route.get("/", route_index.index);

route.get("/login", flash_middleware, route_user.login);
route.post("/login", flash_middleware, route_user.login_api);

export default route;

