import { themes_list } from "shared/types.ts";
import { type User } from "./db.types.ts";

export const user_settings_default = (): Record<string, string> => {
	return {
		theme: 'dark',
	};
};

export const settings_theme_check = (check: string): check is (typeof themes_list)[number] => {
	return themes_list.includes(check as (typeof themes_list)[number]);
};

export type UserContext = {
	user: User;
	settings: Record<string, string>;
};

export const user_settings_context = (user: User, settings: [string, string][]): UserContext => {
	return {
		user,
		settings: Object.fromEntries(settings),
	};
};

