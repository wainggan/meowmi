import { Miss } from "../common.ts";

export type User = {
	id: number;
	username: string;
	password: string;
}

type internal = 'internal';
type exists = 'exists';
type not_found = 'not_found';

export interface DB {
	users_new(username: string, password: string): Promise<null | Miss<internal | exists>>;
	users_get(username: string): Promise<User | Miss<internal | not_found>>;
}

