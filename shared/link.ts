/*
the shape of our urls.
we do this so its easy to see what urls are being used, so we can change url endpoints in the future.
*/

const link = {
	index: () => `/` as const,

	user_view: <T extends string>(username: T) => `/user/${username}` as const,
	user_login: () => `/login` as const,
	user_logout: () => `/logout` as const,
	user_settings: () => `/settings` as const,
	user_cats: <T extends string>(username: T) => `/user/${username}/cat` as const,

	api_cat_list: () => `/api/cat/list` as const,
	api_cat_update: () => `/api/cat/update` as const,
	api_tradelocal_new: () => `/api/trade/local/new` as const,
	api_tradelocal_complete: () => `/api/trade/local/complete` as const,
	api_tradeglobalrequest_new: () => `/api/trade/global/request/new` as const,
	api_tradeglobalresponse_new: () => `/api/trade/global/request/new` as const,
} as const;

export default link;

