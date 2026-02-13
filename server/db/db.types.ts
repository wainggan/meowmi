/*
defines the types and interfaces used for the database.
this makes it easier to find api problems.

see db.sqlite.ts for the implementation.
*/

import { Miss } from "shared/utility.ts";

import { CatDefJson } from "shared/types.ts";

/**
representation of a user.
`username` should be unique, and `password` should
always be hashed for security.
*/
export type User = {
	readonly id: number;
	username: string;
	password: string;
	settings: string;
	tokens: number;
};

export const themes_list = ['light', 'dark'] as const;

/**
user settings.
*/
export type UserSettings = {
	theme: (typeof themes_list)[number];
};

/**
representation of a login session.
valid while `Date.now() < date_expire`.
*/
export type Session = {
	readonly id: string;
	readonly csrf: string;
	readonly user_id: number;
	readonly date_expire: number;
};

export type CatDef = CatDefJson & {
	readonly id: number;
};

/**
an instance of a cat.
*/
export type CatInst = {
	readonly id: number;
	readonly catdef_id: number;
	/** original owner */
	readonly original_user_id: number;
	/** current owner */
	owner_user_id: number;
	/** nickname */
	name: string;
};

export type TradeGlobalRequest = {
	readonly id: number;
	readonly user_id: number;
	readonly catinst_id: number;
	description: string;
};

export type TradeGlobalOffer = {
	readonly id: number;
	readonly user_id: number;
	readonly catinst_id: number;
	readonly traderequest_id: number;
};

export type TradeLocal = {
	readonly id: number;
	readonly peer_x_id: number;
	readonly peer_y_id: number;
	readonly catinst_x_id: number;
	readonly catinst_y_id: number;
};

type internal = 'internal';
type exists = 'exists';
type not_found = 'not_found';
type conflict = 'conflict';

export interface DB {
	/**
	creates a new user. the user's username will be set to `username`, and their password
	will be set to `password` without any adjustments. therefore, `password` should be hashed
	before passing it into this function.
	*/
	user_new(username: string, password: string, settings: string): Promise<number | Miss<internal | exists>>;

	/**
	get a user from an id.
	*/
	user_get_id(user_id: number): Promise<User | Miss<internal | not_found>>;

	/**
	get a user from a username.
	*/
	user_get_name(username: string): Promise<User | Miss<internal | not_found>>;

	/**
	submit changes made to a user.
	returns `null` if successful, and `Miss<'conflict'>` if `user.username` is already
	by another user.
	*/
	user_set(user: User): Promise<null | Miss<internal | conflict>>;

	/**
	deletes a user.
	returns `null` if successful, and `Miss<'not_found'>` if `user_id` is invalid.
	*/
	user_delete(user_id: number): Promise<null | Miss<internal | not_found>>;

	/**
	create a new login session for the user corresponding to `user_id`. `expires` is
	how long the session will be valid for, in hours.
	returns a session id `string`.
	*/
	session_new(user_id: number, expires: number): Promise<string | Miss<internal>>;

	/**
	get a session from a session id..
	*/
	session_get(session_id: string): Promise<Session | Miss<internal | not_found>>;
	session_delete(session_id: string): Promise<null | Miss<internal | not_found>>;

	catdefs_sync(catdefs: CatDef[]): Promise<null | Miss<internal>>;
	catdefs_fill(): Promise<CatDefJson[] | Miss<internal>>;
	catdefs_get(catdef_id: number): Promise<CatDef | Miss<internal>>;

	catinst_add(catdef_id: number, user_id: number): Promise<number | Miss<internal | not_found>>;
	catinst_get(catinst_id: number): Promise<CatInst | Miss<internal | not_found>>;
	catinst_set(catinst: CatInst): Promise<null | Miss<internal>>;
	catinst_delete(catinst_id: number): Promise<null | Miss<internal | not_found>>;
	catinst_list_user(user_id: number, query: string, limit: number, offset: number): Promise<CatInst[] | Miss<internal | not_found>>;

	tradelocal_new(creator_user_id: number, with_user_id: number, creator_catinst_id: number, with_catinst_id: number): Promise<number | Miss<internal>>;
	tradelocal_get(tradelocal_id: number): Promise<TradeLocal | Miss<internal | not_found>>;
	tradelocal_delete(tradelocal_id: number): Promise<null | Miss<internal | not_found>>;
}

