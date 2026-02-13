import vdj from "./validate.ts";
import { status_codes, StatusNames } from "@parchii/router";

// helper schemas

const status = vdj.string().exact(...Object.keys(status_codes) as StatusNames[]);

const error = vdj.object()
	.key('status', vdj.string().exact('err'))
	.key('code', status)
	.key('message', vdj.string());

const ok = vdj.string().exact('ok');

const safeintstr = vdj.string().regex(/[0-9]+/);

const catinst = vdj.object()
	.key('id', vdj.number())
	.key('name', vdj.string());

const catdef = vdj.object()
	.key('name', vdj.string());

// api schemas

const gacha_pull_in = vdj.schema(
	vdj.object()
);

const gacha_pull_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', vdj.string().exact('ok'))
				.key('pull', vdj.array().values(vdj.number()))
		)
);

const cat_list_in = vdj.schema(
	vdj.object()
		.key('user_id', safeintstr, vdj.optional())
		.key('limit', safeintstr)
		.key('offset', safeintstr)
		.key('query', vdj.string())
);

const cat_list_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', vdj.string().exact('ok'))
				.key('list', vdj.array().values(
					vdj.object()
						.key('inst', catinst)
						.key('def', catdef)
				))
		)
);

const cat_update_in = vdj.schema(
	vdj.object()
		.key('cat_id', safeintstr)
		.key('name', vdj.string().regex(/[0-9a-zA-Z_]+/))
);

const cat_update_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', ok)
		)
);

const tradelocal_new_in = vdj.schema(
	vdj.object()
		.key('creator_cat_id', safeintstr)
		.key('target_user_id', safeintstr)
		.key('target_cat_id', safeintstr)
);

const tradelocal_new_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', ok)
				.key('trade_id', vdj.number())
		)
);

const tradelocal_complete_in = vdj.schema(
	vdj.object()
		.key('trade_id', vdj.number())
		.key('accept', vdj.boolean())
	);

const tradelocal_complete_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', ok)
		)
);

const tradeglobalrequest_new_in = vdj.schema(
	vdj.object()
		.key('cat_id', safeintstr)
		.key('description', vdj.string())
);

const tradeglobalrequest_new_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', ok)
				.key('trade_id', vdj.number())
		)
);

const tradeglobalresponse_new_in = vdj.schema(
	vdj.object()
		.key('trade_id', safeintstr)
		.key('cat_id', safeintstr)
);

const tradeglobalresponse_new_out = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', ok)
				.key('response_id', vdj.number())
		)
);


export default {
	gacha_pull_in,
	gacha_pull_out,
	cat_list_in,
	cat_list_out,
	cat_update_in,
	cat_update_out,
	tradelocal_new_in,
	tradelocal_new_out,
	tradelocal_complete_in,
	tradelocal_complete_out,
	tradeglobalrequest_new_in,
	tradeglobalrequest_new_out,
};

