import vdj from "./validate.ts";

const error = vdj.object()
	.key('status', vdj.string().exact('err'))
	.key('code', vdj.number())
	.key('message', vdj.string());

const cat_list_input = vdj.schema(
	vdj.object()
		.key('limit', vdj.number().min(0).integer())
		.key('offset', vdj.number().min(0).integer())
		.key('query', vdj.string())
);

const cat_list_output = vdj.schema(
	vdj.either()
		.or(error)
		.or(
			vdj.object()
				.key('status', vdj.string().exact('ok'))
				.key('list', vdj.array().values(vdj.any()))
		)
);

export default {
	cat_list_input,
	cat_list_output,
};

