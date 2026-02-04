/*
404!
*/

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

const not_found: router.Middleware<{}, router.Method, never> = async ctx => {
	const dom = (
		<template.Base title="index">
			<h1>404</h1>
			<p>
				not found!
			</p>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'not_found', 'html');
};

const unauthorized: router.Middleware<{}, router.Method, never> = async ctx => {
	const dom = (
		<template.Base title="index">
			<h1>unauthorized</h1>
			<p>
				you must be logged in to see that page!
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

