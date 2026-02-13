import { DatabaseSync } from "node:sqlite";
import { DB, User, Session, CatInst, CatDef, TradeLocal } from "./db.types.ts";
import { Miss } from "shared/utility.ts";
import { CatDefJson } from "shared/types.ts";

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

			CREATE TABLE IF NOT EXISTS catdefs (
				id INTEGER PRIMARY KEY,
				key TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				rarity INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS tradelocal (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				peer_x_id INTEGER NOT NULL,
				peer_y_id INTEGER NOT NULL,
				catinst_x_id INTEGER NOT NULL,
				catinst_y_id INTEGER NOT NULL
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

	async catdefs_sync(catdefs: CatDefJson[]): Promise<null | Miss<"internal">> {
		for (const catdef of catdefs) {
			try {
				this.db.prepare(`
					INSERT INTO catdefs
						(key, name, rarity)
					VALUES
						(?, ?, ?)
					ON CONFLICT (key) DO UPDATE SET
						name = excluded.name,
						rarity = excluded.rarity;
				`).run(catdef.key, catdef.name, catdef.rarity);
			}
			catch (_e) {
				console.error(_e);
				return new Miss('internal', `unknown internal error`);
			}
		}

		return null;
	}

	async catdefs_fill(): Promise<CatDef[] | Miss<"internal">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM catdefs;
			`).all();
		}
		catch (_e) {
			console.error(_e);
			return new Miss('internal', `unknown internal error`);
		}

		return result as CatDef[];
	}

	async catdefs_get(catdef_id: number): Promise<CatDef | Miss<"internal">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM catdefs
				WHERE id = (?);
			`).get(catdef_id);
		}
		catch (_e) {
			console.error(_e);
			return new Miss('internal', `unknown internal error`);
		}

		return result as CatDef;
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
					owner_user_id = (?),
					name = (?)
				WHERE
					id = (?);
			`).run(catinst.owner_user_id, catinst.name, catinst.id);
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

	async catinst_list_user(user_id: number, query: string, limit: number, offset: number): Promise<CatInst[] | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT catinsts.* FROM catinsts
				JOIN catdefs ON catinsts.catdef_id = catdefs.id
				WHERE catinsts.owner_user_id = (?) AND (catinsts.name LIKE '%' || (?) || '%' OR catdefs.name LIKE '%' || (?) || '%')
				LIMIT (?) OFFSET (?);
			`).all(user_id, query, query, limit, offset);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return result as CatInst[];
	}

	async tradelocal_new(creator_user_id: number, with_user_id: number, creator_catinst_id: number, with_catinst_id: number): Promise<number | Miss<"internal">> {
		let result;

		try {
			result = this.db.prepare(`
				INSERT INTO tradelocal
					(peer_x_id, peer_y_id, catinst_x_id, catinst_y_id)
				VALUES
					(?, ?, ?, ?);
			`).run(creator_user_id, with_user_id, creator_catinst_id, with_catinst_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return result.lastInsertRowid as number;
	}

	async tradelocal_get(tradelocal_id: number): Promise<TradeLocal | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				SELECT * FROM tradelocal
				WHERE id = (?);
			`).get(tradelocal_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined) {
			return new Miss('not_found', `local trade id '${tradelocal_id}' not found`);
		}

		return result as TradeLocal;
	}

	async tradelocal_delete(tradelocal_id: number): Promise<null | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.db.prepare(`
				DELETE FROM tradelocal
				WHERE id = (?);
			`).run(tradelocal_id);
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result.changes !== 1) {
			return new Miss('not_found', `did not delete 1 row`);
		}

		return null;
	}
}

