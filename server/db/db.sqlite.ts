/*
the implementation of the database. this is the nervous system of our game.
*/

import { DatabaseSync, SQLInputValue, SQLOutputValue, StatementResultingChanges, StatementSync } from "node:sqlite";
import { DB, User, Session, CatInst, CatDef, TradeLocal } from "./db.types.ts";
import { Miss } from "shared/utility.ts";
import { CatDefJson } from "shared/types.ts";

const util_hash = (str: string, limit: number): number => {
	let hash = 0;
	for (let i = 0, len = Math.min(str.length, limit); i < len; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return hash;
};

const util_hash_list = (str_list: Iterable<string>, limit: number, sub: number): number => {
	let acc = 0, left = limit;
	for (const s of str_list) {
		const diff = Math.min(left, sub);
		acc = acc + util_hash(s, diff) | 0;
		left -= diff;
		if (left <= 0) {
			break;
		}
	}
	return acc;
};

class Cache {
	constructor(db: DatabaseSync) {
		this.#db = db;
		this.#internal = new Map();
	}

	#db: DatabaseSync;
	#internal: Map<number, (readonly [number, number, string, StatementSync])[]>;

	cache(str: TemplateStringsArray, input_count: number): StatementSync {
		const hash = util_hash_list(str, 32, 8);

		let l1 = this.#internal.get(hash);
		if (l1 === undefined) {
			l1 = [];
			this.#internal.set(hash, l1);
		}

		let collect_cache: string | undefined;
		const collect = () => {
			if (collect_cache !== undefined) {
				return collect_cache;
			}
			let acc = "", left = input_count;
			str.forEach(x => (acc += x, acc += (left-- > 0) ? "(?)" : ""));
			collect_cache = acc;
			return collect_cache;
		};
		
		let l2;
		for (const lx of l1) {
			if (lx[0] === str.length && lx[1] === input_count && lx[2] === collect()) {
				l2 = lx;
				break;
			}
		}

		if (l2 === undefined) {
			const str = collect();
			const statement = this.#db.prepare(str);
			l2 = [str.length, input_count, str, statement] as const;
			l1.push(l2);
		}

		return l2[3];
	}

	run(str: TemplateStringsArray, ...input: SQLInputValue[]): StatementResultingChanges {
		return this.cache(str, input.length).run(...input);
	}

	all(str: TemplateStringsArray, ...input: SQLInputValue[]): Record<string, SQLOutputValue>[] {
		return this.cache(str, input.length).all(...input);
	}

	get(str: TemplateStringsArray, ...input: SQLInputValue[]): Record<string, SQLOutputValue> | undefined {
		return this.cache(str, input.length).get(...input);
	}
}

export class DBSql implements DB {
	constructor(path: string) {
		this.db = new DatabaseSync(path + '/db.sql');

		this.sql = new Cache(this.db);
		
		this.db.exec(`
			PRAGMA foreign_keys = ON;
			
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password TEXT NOT NULL,
				tokens INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS settings (
				user_id INTEGER NOT NULL,
				key TEXT NOT NULL,
				value TEXT NOT NULL,
				PRIMARY KEY (user_id, key),
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
	sql: Cache;

	async user_new(username: string, password: string): Promise<number | Miss<'internal' | 'exists'>> {
		let result;

		try {
			result = this.sql.run `
				INSERT INTO users
					(username, password, tokens)
				VALUES
					(${username}, ${password}, ${100});`;
		}
		catch (_e) {
			return new Miss('exists', `username '${username}' already exists`);
		}

		return result.lastInsertRowid as number;
	}

	async user_get_name(username: string): Promise<User | Miss<"internal" | "not_found">> {
		let result;

		try {
			result = this.sql.get `
				SELECT * FROM users
				WHERE username = (${username});`;
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
			result = this.sql.get `
				SELECT * FROM users
				WHERE id = (${user_id});`;
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
			this.sql.run `
				UPDATE users
				SET
					username = (${user.username}),
					password = (${user.password}),
					tokens = (${user.tokens})
				WHERE
					id = (${user.id});`;
		}
		catch (_e) {
			return new Miss('conflict', `username '${user.username}' already exists`);
		}

		return null;
	}

	async user_delete(user_id: number): Promise<null | Miss<"internal" | "not_found">> {
		try {
			this.sql.run `DELETE FROM users WHERE id = (${user_id});`;
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return null;
	}

	async settings_get(user_id: number, key: string, def?: string): Promise<string | undefined | Miss<"internal">> {
		let result;

		try {
			result = this.sql.get `SELECT value FROM settings WHERE user_id = ${user_id} AND key = ${key}`;
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		if (result === undefined && def !== undefined) {
			const result_set = await this.settings_set(user_id, key, def);
			if (result_set instanceof Miss) {
				return result_set;
			}

			return def;
		}

		return result !== undefined ? result['value'] as string : undefined;
	}

	async settings_set(user_id: number, key: string, value: string): Promise<null | Miss<"internal">> {
		try {
			this.sql.run `
				INSERT INTO settings
					(user_id, key, value)
				VALUES
					(${user_id}, ${key}, ${value})
				ON CONFLICT (user_id, key) DO UPDATE SET
					value = excluded.value;`;
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return null;
	}

	async settings_list(user_id: number): Promise<[string, string][] | Miss<"internal">> {
		let result;

		try {
			result = this.sql.all `SELECT * FROM settings WHERE user_id = ${user_id};`;
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return result.values().map(x => [x['key'] as string, x['value'] as string] as [string, string]).toArray();
	}

	async session_new(user_id: number, expires: number): Promise<string | Miss<'internal'>> {
		const now = Date.now();

		// purge old sessions
		try {
			this.sql.run `DELETE FROM sessions WHERE date_expire <= (${now});`;
		}
		catch (_e) {
			return new Miss('internal', `sessions could not be purged`);
		}

		const session_id = crypto.randomUUID();
		const csrf = crypto.randomUUID();
		const time = now + 1000 * 60 * 60 * 60 * expires;

		try {
			this.sql.run `
				INSERT INTO sessions
					(id, csrf, user_id, date_expire)
				VALUES
					(${session_id}, ${csrf}, ${user_id}, ${time});`;
		}
		catch (_e) {
			return new Miss('internal', `session could not be deleted`)
		}
		
		return session_id;
	}

	async session_get(session_id: string): Promise<Session | Miss<'internal' | 'not_found'>> {
		let result;

		try {
			result = this.sql.get `
				SELECT * FROM sessions
				WHERE sessions.id = ${session_id} AND sessions.date_expire > ${Date.now()};`;
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
			this.sql.run `DELETE FROM sessions WHERE id = (${session_id});`;
		}
		catch (_e) {
			return new Miss('not_found', `session does not exist`);
		}

		return null;
	}

	async catdefs_sync(catdefs: CatDefJson[]): Promise<null | Miss<"internal">> {
		for (const catdef of catdefs) {
			try {
				this.sql.run `
					INSERT INTO catdefs
						(key, name, rarity)
					VALUES
						(${catdef.key}, ${catdef.name}, ${catdef.rarity})
					ON CONFLICT (key) DO UPDATE SET
						name = excluded.name,
						rarity = excluded.rarity;`;
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
			result = this.sql.all `SELECT * FROM catdefs;`;
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
			result = this.sql.get `SELECT * FROM catdefs WHERE id = (${catdef_id});`;
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
			result = this.sql.run `
				INSERT INTO catinsts
					(catdef_id, original_user_id, owner_user_id, name)
				VALUES
					(${catdef_id}, ${user_id}, ${user_id}, ${"cat"});`;
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
			result = this.sql.get `SELECT * FROM catinsts WHERE id = (${catinst_id});`;
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
			this.sql.run `
				UPDATE catinsts
				SET
					owner_user_id = (${catinst.owner_user_id}),
					name = (${catinst.name})
				WHERE
					id = (${catinst.id});`;
		}
		catch (e) {
			console.error(e);
			return new Miss('internal', `unknown internal error`);
		}

		return null;
	}

	async catinst_delete(catinst_id: number): Promise<null | Miss<"internal" | "not_found">> {
		try {
			this.sql.run `DELETE FROM catinsts WHERE id = (${catinst_id});`;
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
			result = this.sql.all `
				SELECT catinsts.* FROM catinsts
				JOIN catdefs ON catinsts.catdef_id = catdefs.id
				WHERE catinsts.owner_user_id = (${user_id}) AND (catinsts.name LIKE '%' || (${query}) || '%' OR catdefs.name LIKE '%' || (${query}) || '%')
				LIMIT (${limit}) OFFSET (${offset});`;
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
			result = this.sql.run `
				INSERT INTO tradelocal
					(peer_x_id, peer_y_id, catinst_x_id, catinst_y_id)
				VALUES
					(${creator_user_id}, ${with_user_id}, ${creator_catinst_id}, ${with_catinst_id});`;
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
			result = this.sql.get `SELECT * FROM tradelocal WHERE id = (${tradelocal_id});`;
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
			result = this.sql.run `DELETE FROM tradelocal WHERE id = (${tradelocal_id});`;
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

