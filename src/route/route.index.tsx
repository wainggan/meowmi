/*
page used for the front page.
*/

import * as router from "@parchii/router";
import * as template from "./template.tsx";

import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";
import { SessionExport } from "./util.session.tsx";

const index: router.Middleware<{}, 'GET', never, SessionExport> = async ctx => {
	const user = ctx.ware.session.user();

	const dom = (
		<template.Base title="index" user={ user }>
			<main>
				<div class="hero">
					NEWS TICKER ART
				</div>
			</main>

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

