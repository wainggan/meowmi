import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

const index: router.Middleware<{}, 'GET', never> = async ctx => {
	const dom = (
		<template.Base title="index">
			meow!
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

export default {
	index,
};

