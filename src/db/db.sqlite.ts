import { DatabaseSync } from "node:sqlite";
import { DB, User, Session, CatInst } from "./db.types.ts";
import { Miss } from "../common.ts";

export class DBSql implements DB {
	constructor(path: string) {
		this.db = new DatabaseSync(path + '/db.sql');

		this.db.exec(`
			PRAGMA foreign_keys = ON;
			
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password TEXT NOT NULL,
				settings TEXT NOT NULL,
				tokens INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				csrf TEXT NOT NULL,
				user_id INTEGER NOT NULL,
				date_expire INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS catinsts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				catdef_id INTEGER NOT NULL,
				original_user_id INTEGER,
				owner_user_id INTEGER NOT NULL,
				name TEXT NOT NULL,
				FOREIGN KEY (original_user_id) REFERENCES users(id) ON DELETE SET NULL,
				FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);
	}

	db: DatabaseSync;

	async user_new(username: string, password: string, settings: string): Promise<number | Miss<'internal' | 'exists'>> {
		let result;
		try {
			result = this.db.prepare(`
				INSERT INTO users
					(username, password, settings, tokens)
				VALUES
					(?, ?, ?, ?);
			`).run(username, password, settings, 5);
		}
		catch (_e) {
			return new Miss('exists', `username '${username}' already exists`);
		}

		return result.lastInsertRowid as number;
	}

	async user_get_name(username: string): Promise<User | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM users
				WHERE username = (?);
			`).get(username);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `username '${username}' does not exist`);
		}

		return result as User;
	}

	async user_get_id(user_id: number): Promise<User | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM users
				WHERE id = (?);
			`).get(user_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `user id '${user_id}' does not exist`);
		}

		return result as User;
	}

	async user_set(user: User): Promise<null | Miss<"internal" | "conflict">> {
		try {
			this.db.prepare(`
				UPDATE users
				SET
					username = (?),
					password = (?),
					settings = (?),
					tokens = (?)
				WHERE
					id = (?);
			`).run(user.username, user.password, user.settings, user.tokens, user.id);
		}
		catch (_e) {
			return new Miss('conflict', `username '${user.username}' already exists`);
		}

		return null;
	}

	async user_delete(user_id: number): Promise<null | Miss<"internal" | "not_found">> {
		try {
			this.db.prepare(`
				DELETE FROM users
				WHERE id = (?);
			`).run(user_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
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
				SELECT * FROM sessions
				WHERE sessions.id = (?) AND sessions.date_expire > (?);
			`).get(session_id, Date.now());
		}
		catch (e) {
			console.error(e);
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

	async catinst_add(catdef_id: number, user_id: number): Promise<number | Miss<'internal' | 'not_found'>> {
		let result;

		try {
			result = this.db.prepare(`
				INSERT INTO catinsts
					(catdef_id, original_user_id, owner_user_id, name)
				VALUES
					(?, ?, ?, ?);
			`).run(catdef_id, user_id, user_id, "cat");
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return result.lastInsertRowid as number;
	}

	async catinst_get(catinst_id: number): Promise<CatInst | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM catinsts
				WHERE id = (?);
			`).get(catinst_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `catinst id ${catinst_id} does not exist`);
		}

		return result as CatInst;
	}

	async catinst_set(catinst: CatInst): Promise<null | Miss<"internal">> {
		try {
			this.db.prepare(`
				UPDATE catinsts
				SET
					owner_user_id = (?)
				WHERE
					id = (?);
			`).run(catinst.owner_user_id, catinst.id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return null;
	}

	async catinst_delete(catinst_id: number): Promise<null | Miss<"internal" | "not_found">> {
		try {
			this.db.prepare(`
				DELETE FROM catinsts
				WHERE id = (?);
			`).run(catinst_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return null;
	}

	async catinst_list_user(user_id: number, limit: number, offset: number): Promise<CatInst[] | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM catinsts
				WHERE owner_user_id = (?)
				LIMIT (?) OFFSET (?);
			`).all(user_id, limit, offset);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return result as CatInst[];
	}
}

