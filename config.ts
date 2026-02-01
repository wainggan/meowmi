/*
the config file!
*/

const config: import("./src/config.types.ts").default = {
	// database settings
	db: {
		// where the database is located
		path: './local/db.sql',
	},
};

export default config;

