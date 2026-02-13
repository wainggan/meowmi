/*
404!
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { SessionExport } from "./util.session.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";

const not_found: router.Middleware<{}, router.Method, never, SessionExport> = async ctx => {
	const user = ctx.ware.session.user();

	const dom = (
		<template.Base title="index" user={ user }>
			<h1>404</h1>
			<p>
				not found!
			</p>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'not_found', 'html');
};

const unauthorized: router.Middleware<{}, router.Method, never, SessionExport> = async ctx => {
	const user = ctx.ware.session.user();

	const dom = (
		<template.Base title="index" user={ user }>
			<h1>unauthorized</h1>
			<p>
				you are not authorized to see that page.
				{ user === null ? 'perhaps you are not logged in?' : '' }
			</p>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'unauthorized', 'html');
};

export default {
	not_found,
	unauthorized,
};

