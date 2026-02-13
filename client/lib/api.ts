import vdj, { Validated } from "shared/validate.ts";
import api_schema from "shared/api.schema.ts";
import link from "shared/link.ts";

const makerequest = async <T extends ReturnType<typeof vdj.schema>>(schema: T, endpoint: string, input: object) => {
	const json = JSON.stringify(input);

	const headers = new Headers();
	headers.set('Content-Type', "application/json");

	const url = globalThis.location.origin + endpoint;

	const result = await fetch(url, {
			method: 'POST',
			body: json,
			headers,
		})
		.then(x => x.json())
		.catch(x => {
			throw x;
		});
	
	if (!schema.validate(result)) {
		console.error(result);
		throw new TypeError(`server output not valid`);
	}

	return result;
};

const cat_list = async (input: Validated<typeof api_schema.cat_list_in>):
	Promise<Validated<typeof api_schema.cat_list_out>> =>
	await makerequest(api_schema.cat_list_out, link.api_cat_list(), input);

const cat_update = async (input: Validated<typeof api_schema.cat_update_in>):
	Promise<Validated<typeof api_schema.cat_update_out>> =>
	await makerequest(api_schema.cat_update_out, link.api_cat_update(), input);

const tradelocal_new = async (input: Validated<typeof api_schema.tradelocal_new_in>):
	Promise<Validated<typeof api_schema.tradelocal_new_out>> =>
	await makerequest(api_schema.tradelocal_new_out, link.api_tradelocal_new(), input);

export default {
	cat_list,
	cat_update,
	tradelocal_new,
};

