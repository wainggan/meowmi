/*
page used for the front page.
*/

import * as router from "@parchii/router.ts";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx.ts";
import { render } from "@parchii/html.ts";
import { SessionExport } from "./util.session.tsx";
import splash_list from "shared/splash.json" with { type: 'json' };


const index: router.Middleware<{}, 'GET', never, SessionExport> = async ctx => {
	const user = ctx.ware.session.user();

	const splash_text = splash_list[splash_list.length * Math.random() | 0];

	const dom = (
		<template.Base title="index" user={ user }>
			<div class="content-hero">
				<main>
					<div class="splash">{ splash_text }</div>
					NEWS TICKER ART
				</main>
			</div>

			<div class="carousel-wrap">
				<div class="carousel">
					<div class="banner">Current Banner Cats</div>
					<div class="banner">Limited Pull Shop</div>
					<div class="banner">Event Rewards</div>
				</div>
			</div>
		</template.Base>
	);

	const src = render(dom);

	return ctx.build_response(src, 'ok', 'html');
};

export default {
	index,
};

