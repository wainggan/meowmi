import application from "@parchii/application";
import route from "./route/route.ts";

import { DBSql } from "./db/db.sqlite.ts";
import { DatabaseSync } from "node:sqlite";

const db = new DBSql(new DatabaseSync('local/db.sql'));

const app = application({
	data: {
		db,
	},
	route,
	stdio: true,
});

Deno.serve(app);
