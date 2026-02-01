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
}

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
	users_new(username: string, password: string): Promise<null | Miss<internal | exists>>;

	/**
	get a user from a username.
	@arg username username to search for.
	*/
	users_get(username: string): Promise<User | Miss<internal | not_found>>;

	/**
	submit changes made to a user.
	@arg user user to be changed.
	*/
	users_set(user: User): Promise<null | Miss<internal | conflict>>;
}

