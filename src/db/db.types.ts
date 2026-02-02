/*
defines the types and interfaces used for the database.
this makes it easier to find api problems.
*/

import { Miss } from "../common.ts";

/**
representation of a user.
all fields except `id` are freely editable.
`username` should be unique, and `password` should
always be hashed for security.
*/
export type User = {
	readonly id: number;
	username: string;
	password: string;
};

export type Session = {
	readonly id: string;
	readonly csrf: string;
	readonly user_id: number;
	readonly date_expire: number;
};

type internal = 'internal';
type exists = 'exists';
type not_found = 'not_found';
type conflict = 'conflict';

export interface DB {
	/**
	creates a new user.
	@arg username username to use.
	@arg password password to use. this should be hashed before inserting.
	*/
	users_new(username: string, password: string): Promise<number | Miss<internal | exists>>;

	/**
	get a user from a username.
	@arg user_id username to search for.
	*/
	users_get_id(user_id: number): Promise<User | Miss<internal | not_found>>;

	/**
	get a user from a username.
	@arg username username to search for.
	*/
	users_get_name(username: string): Promise<User | Miss<internal | not_found>>;

	/**
	submit changes made to a user.
	@arg user user to be changed.
	*/
	users_set(user: User): Promise<null | Miss<internal | conflict>>;

	/**
	create a new login session
	@arg user_id id of the user being logged in
	@arg expires how long the session is valid for, in hours
	*/
	session_new(user_id: number, expires: number): Promise<string | Miss<internal>>;
	session_get(session_id: string): Promise<Session | Miss<internal | not_found>>;
	session_delete(session_id: string): Promise<null | Miss<internal | not_found>>;
}

