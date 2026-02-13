/*
several functions for making requests to the server.
*/

import config from "../../config-client.ts";

import vdj, { Validated } from "shared/validate.ts";
import api_schema from "shared/api.schema.ts";
import link from "shared/link.ts";

// utility function for implementing the actual functions here.
const makerequest = async <T extends ReturnType<typeof vdj.schema>>(schema: T, endpoint: string, input: object) => {
	// if this throws, skill issue.
	const json = JSON.stringify(input);

	const headers = new Headers();
	headers.set('Content-Type', "application/json");

	const url = globalThis.location.origin + endpoint;

	const response = await fetch(url, {
			// all of the server endpoints are POST.
			method: 'POST',
			body: json,
			// include session cookie
			credentials: 'same-origin',
			headers,
		})
		.then(x => x.json())
		.catch(x => {
			throw x;
		});
	
	if (config.validate) {
		if (!schema.validate(response)) {
			console.error(response);
			throw new TypeError(`server response failed validation`);
		}
	}

	return response;
};

/**
list out cats owned by a user.
*/
const cat_list = async (input: Validated<typeof api_schema.cat_list_in>):
	Promise<Validated<typeof api_schema.cat_list_out>> =>
	await makerequest(api_schema.cat_list_out, link.api_cat_list(), input);

/**
update various fields of a cat. you must be logged in to use this.
*/
const cat_update = async (input: Validated<typeof api_schema.cat_update_in>):
	Promise<Validated<typeof api_schema.cat_update_out>> =>
	await makerequest(api_schema.cat_update_out, link.api_cat_update(), input);

/**
create a new peer-to-peer trade. you must be logged in to use this.
*/
const tradelocal_new = async (input: Validated<typeof api_schema.tradelocal_new_in>):
	Promise<Validated<typeof api_schema.tradelocal_new_out>> =>
	await makerequest(api_schema.tradelocal_new_out, link.api_tradelocal_new(), input);

export default {
	cat_list,
	cat_update,
	tradelocal_new,
};

