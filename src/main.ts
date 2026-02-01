import application from "@parchii/application";
import route from "./route/route.ts";

import config from "../config.ts";

import { DBSql } from "./db/db.sqlite.ts";
import { DatabaseSync } from "node:sqlite";

const db = new DBSql(new DatabaseSync(config.db.path));

const app = application({
	data: {
		db,
		config,
	},
	route,
	stdio: true,
});

Deno.serve(app);
