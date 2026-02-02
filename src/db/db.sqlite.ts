import { DatabaseSync } from "node:sqlite";
import { DB, User, Session } from "./db.types.ts";
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

			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				csrf TEXT NOT NULL,
				user_id INTEGER NOT NULL,
				date_expire INTEGER NUL NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);
	}

	db: DatabaseSync;

	async users_new(username: string, password: string): Promise<number | Miss<'internal' | 'exists'>> {
		let result;
		try {
			result = this.db.prepare(`
				INSERT INTO users
					(username, password)
				VALUES
					(?, ?);
			`).run(username, password);
		}
		catch (_e) {
			return new Miss('exists', `username '${username}' already exists`);
		}

		return result.lastInsertRowid as number;
	}

	async users_get_name(username: string): Promise<User | Miss<"internal" | "not_found">> {
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

	async users_get_id(user_id: number): Promise<User | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM users
				WHERE id = (?);
			`).get(user_id);
		}
		catch (_e) {
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `user id '${user_id}' does not exist`);
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

	async session_new(user_id: number, expires: number): Promise<string | Miss<'internal'>> {
		const now = Date.now();

		// purge old sessions
		try {
			this.db.prepare(`
				DELETE FROM sessions
				WHERE date_expire <= (?);
			`).run(now);
		}
		catch (_e) {
			return new Miss('internal', `sessions could not be purged`);
		}

		const session_id = crypto.randomUUID();
		const csrf = crypto.randomUUID();
		// 14 days
		const time = now + 1000 * 60 * 60 * 60 * expires;

		try {
			this.db.prepare(`
				INSERT INTO sessions
					(id, csrf, user_id, date_expire)
				VALUES
					(?, ?, ?, ?);
			`).run(session_id, csrf, user_id, time);
		}
		catch (_e) {
			return new Miss('internal', `session could not be deleted`)
		}
		
		return session_id;
	}

	async session_get(session_id: string): Promise<Session | Miss<'internal' | 'not_found'>> {
		let result;
		try {
			result = this.db.prepare(`
				SELECT users.* FROM sessions
				JOIN users ON users.id = sessions.user_id
				WHERE sessions.id = (?) AND sessions.date_expire > (?);
			`).get(session_id, Date.now());
		}
		catch (_e) {
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `session id not valid`);
		}

		return result as Session;
	}

	async session_delete(session_id: string): Promise<null | Miss<'internal' | 'not_found'>> {
		try {
			this.db.prepare(`
				DELETE FROM sessions
				WHERE id = (?);
			`).run(session_id);
		}
		catch (_e) {
			return new Miss('not_found', `session does not exist`);
		}

		return null;
	}
}

