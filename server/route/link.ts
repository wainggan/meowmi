const link = {
	index: () => `/` as const,
	user_view: <T extends string>(username: T) => `/user/${username}` as const,
	user_login: () => `/login` as const,
} as const;

export default link;

