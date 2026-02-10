
import * as router from "@parchii/router";
import { Shared } from "../shared.ts";
import { SessionExport } from "./util.session.tsx";
import { Miss } from "../common.ts";
import api_schema from "shared/api.schema.ts";
import api from "../api.ts";

const api_cat_list: router.Middleware<Shared, 'POST', never, SessionExport> = async ctx => {
	const form_data = await ctx.request.formData();

	let output_json;
	let output_code: router.StatusNames;

	exit: {
		const user = ctx.ware.session.user();
		if (user === null) {
			output_code = 'unauthorized';
			output_json = {
				status: 'err',
				code: output_code,
				message: `missing session cookie`,
			};
			break exit;
		}

		const form: object = {
			query: form_data.get('query'),
			offset: form_data.get('offset'),
			limit: form_data.get('limit'),
		};

		if (!api_schema.cat_list_in.validate(form)) {
			output_code = 'bad_request';
			output_json = {
				status: 'err',
				code: output_code,
				message: `invalid form data`,
			};
			break exit;
		}

		const result = await api.cat_list(ctx.data, user, form);

		if (result.status === 'err') {
			output_code = result.code;
			output_json = result;
			break exit;
		}

		output_code = 'ok'
		output_json = result;
	}

	if (!api_schema.cat_list_out.validate(output_json)) {
		console.error(output_json);
		throw new Error(`output json does not match schema`);
	}

	const str = JSON.stringify(output_json);
	
	return ctx.build_response(str, output_code, 'json');
};

const api_cat_update: router.Middleware<Shared, 'POST', never, SessionExport> = async ctx => {
	const form_data = await ctx.request.formData();

	let output_json;
	let output_code: router.StatusNames;

	exit: {
		const user = ctx.ware.session.user();
		if (user === null) {
			output_code = 'unauthorized';
			output_json = {
				status: 'err',
				code: output_code,
				message: `missing session cookie`,
			};
			break exit;
		}

		const form = {
			id: form_data.get('id'),
			name: form_data.get('name'),
		};

		if (!api_schema.cat_update_in.validate(form)) {
			output_code = 'bad_request';
			output_json = {
				status: 'err',
				code: output_code,
				message: `invalid form data`,
			};
			break exit;
		}

		const catinst = await ctx.data.db.catinst_get(Number(form.id));
		if (catinst instanceof Miss) {
			output_code = 'internal_error';
			output_json = {
				status: 'err',
				code: output_code,
				message: catinst.toString(),
			};
			break exit;
		}

		catinst.name = form.name.trim();

		const result = await ctx.data.db.catinst_set(catinst);
		if (result instanceof Miss) {
			output_code = 'internal_error';
			output_json = {
				status: 'err',
				code: output_code,
				message: catinst.toString(),
			};
			break exit;
		}

		output_code = 'ok';
		output_json = {
			status: 'ok',
		};
		break exit;
	}

	if (!api_schema.cat_update_out.validate(output_json)) {
		console.error(output_json);
		throw new Error(`output json does not match schema`);
	}

	const str = JSON.stringify(output_json);

	return ctx.build_response(str, output_code, 'json');
};

export default {
	api_cat_list,
	api_cat_update,
};
