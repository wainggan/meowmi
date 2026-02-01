import { DatabaseSync } from "node:sqlite";
import { DB, User } from "./db.types.ts";
import { Miss } from "../common.ts";

export class DBSql implements DB {
	constructor(db: DatabaseSync) {
		this.db = db;

		this.db.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE,
				password TEXT
			);
		`);
	}

	db: DatabaseSync;

	async users_new(username: string, password: string): Promise<null | Miss<'internal' | 'exists'>> {
		try {
			this.db.prepare(`
				INSERT INTO users
					(username, password)
				VALUES
					(?, ?);
			`).run(username, password);
		}
		catch (_e) {
			return new Miss('exists', `username '${username}' already exists`);
		}

		return null;
	}

	async users_get(username: string): Promise<User | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM users
				WHERE username = (?);
			`).get(username);
		}
		catch (_e) {
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `username '${username}' does not exist`);
		}

		return result as User;
	}

	async users_set(user: User): Promise<null | Miss<"internal" | "conflict">> {
		try {
			this.db.prepare(`
				UPDATE users
				SET
					username = (?),
					password = (?)
				WHERE
					id = (?);
			`).run(user.username, user.password, user.id);
		}
		catch (_e) {
			return new Miss('conflict', `username '${user.username}' already exists`);
		}

		return null;
	}
}

