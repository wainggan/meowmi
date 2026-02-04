/*
the config file!
*/

const config: import("./src/config.types.ts").default = {
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

