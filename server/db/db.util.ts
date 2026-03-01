import { themes_list } from "shared/types.ts";
import { Notification, type User } from "./db.types.ts";
import { Shared } from "../shared.ts";
import { Miss } from "shared/utility.ts";

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
	notifications: Notification[];
};

export const user_context = async (shared: Shared, user: User): Promise<UserContext | Miss<'internal'>> => {
	const settings = await shared.db.settings_list(user.id);
	if (settings instanceof Miss) {
		return settings;
	}

	const notifications = await shared.db.notification_list(user.id);
	if (notifications instanceof Miss) {
		return notifications;
	}

	return user_context_build(user, settings, notifications);
};

export const user_context_build = (
	user: User,
	settings: IteratorObject<{ key: string, value: string }>,
	notifications: IteratorObject<Notification>
): UserContext => {
	return {
		user,
		settings: Object.fromEntries(settings.map(x => [x.key, x.value])),
		notifications: notifications.toArray(),
	};
};

