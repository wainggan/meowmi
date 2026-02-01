/*
this file defines `Shared`, which is used in middleware to access global
configuration, such as a database connection or the actual `config.ts`.
*/

import Config from "./config.types.ts";
import { DB } from "./db/db.types.ts";

export type Shared = {
	db: DB;
	config: Config;
};

