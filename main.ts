import * as router from "@parchii/router";
import application from "@parchii/application";

const route = new router.Router();

route.get("/", async (ctx) => {
	return ctx.build_response("meow", "ok", "txt");
});

const app = application({
	data: null,
	route,
	stdio: true,
});

Deno.serve(app);
