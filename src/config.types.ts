/*
this file defines the `Config` type, which is used to ensure the `config.ts` file is well formed.
*/

type Config = {
	readonly db: {
		readonly path: string;
	};
};
export default Config;

