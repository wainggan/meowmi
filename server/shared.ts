/*
this file defines `Shared`, which is used in middleware to access global
configuration, such as a database connection or the actual `config.ts`.
*/

import { CatDef, DB } from "./db/db.types.ts";

export type Shared = {
	db: DB;
	catdefs: {
		[id: number]: CatDef;
	};
};

