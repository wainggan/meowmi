import { themes_list, User, UserSettings } from "./db.types.ts";

export const user_settings_extract = (user: User | null): UserSettings => {
	const out = user_settings_default();
	if (user !== null) {
		const json = JSON.parse(user.settings);
		Object.assign(out, json);
	}
	return out;
};

export const user_settings_pack = (settings: UserSettings): string => {
	return JSON.stringify(settings);
};

export const user_settings_default = (): UserSettings => {
	return {
		theme: 'dark',
	};
};

export const settings_theme_check = (check: string): check is (typeof themes_list)[number] => {
	return themes_list.includes(check as (typeof themes_list)[number]);
};

