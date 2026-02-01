import * as router from "@parchii/router";

import route_index from "./route.index.tsx";

const route = new router.Router();

route.get("/ping", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

route.get("/", route_index.index);

export default route;

