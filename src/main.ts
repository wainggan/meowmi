import application from "@parchii/application";
import route from "./route/route.ts";

import config from "../config.ts";

import { DBSql } from "./db/db.sqlite.ts";

Deno.mkdir(config.db.path, {
	recursive: true,
});

const db = new DBSql(config.db.path);

import('../playground.jsx');

const app = application({
	data: {
		db,
	},
	route,
	stdio: config.verbose.requests,
});

Deno.serve(app);
