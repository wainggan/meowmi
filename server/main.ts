import route from "./route/route.ts";

import config from "../config.ts";

import catdefs_json from "shared/data.catdefs.ts";

import { DBSql } from "./db/db.sqlite.ts";
import { Miss } from "shared/utility.ts";

Deno.mkdir(config.db.path, {
	recursive: true,
});

const db = new DBSql(config.db.path);

const result_sync = await db.catdefs_sync(catdefs_json);
if (result_sync instanceof Miss) {
	throw result_sync.toError();
}

const catdefs_list = await db.catdefs_fill();
if (catdefs_list instanceof Miss) {
	throw catdefs_list.toError();
}

const catdefs = Object.fromEntries(catdefs_list.values().map(x => [x.id, x]));

const data = {
	db,
	catdefs,
};

Deno.serve(async request => {
	if (config.verbose.requests) {
		console.log(request.method, request.url);
	}

	return route.resolve(request, data);
});
