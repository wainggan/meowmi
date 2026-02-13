/*
this file defines the `ConfigClient` type, which is used to ensure the `config-client.ts` file is well formed.
we keep this separate from `config.ts` to avoid security issues.
*/

type ConfigClient = {
	readonly validate: boolean;
};
export default ConfigClient;
