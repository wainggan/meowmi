/*
the config file!
*/

const config: import("shared/config.types.ts").default = {
	// database settings
	db: {
		// where the database directory is located
		path: './.local/db',
	},
	verbose: {
		// print server requests to stdio
		requests: true,
		// print database logs to stdio
		database: true,
	},
};

export default config;

