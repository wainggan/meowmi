import { User, UserSettings } from "./db.types.ts";

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

