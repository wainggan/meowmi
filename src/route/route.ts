/*
gathers together all our middleware and exports a `Router`.
*/

import * as router from "@parchii/router";
import { Shared } from "../shared.ts";

import route_index from "./route.index.tsx";

const route = new router.Router<Shared>();

route.get("/ping", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

route.get("/", route_index.index);

export default route;

