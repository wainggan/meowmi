/*
the config file, for use in the web client.
*/

const config: import("shared/config-client.types.ts").default = {
	// whether to enable validation of server responses.
	// useful for debugging, but may hurt performance.
	validate: true,
};

export default config;

