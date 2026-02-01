import application from "@parchii/application";
import route from "./route/route.ts";

const app = application({
	data: null,
	route,
	stdio: true,
});

Deno.serve(app);
