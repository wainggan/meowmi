import { Session, User } from "../db/db.types.ts";
import { Shared } from "../shared.ts";
import { ErrorUnauthorizedExport } from "./ware.error.tsx";
import { SessionExport } from "./ware.session.tsx";

import * as router from "@parchii/router.ts";

export type ForceSessionExport = {
	force_session: {
		readonly user: () => User;
		readonly session: () => Session;
	};
};

export const force_session_middleware: router.Middleware<Shared, router.Method, [], [ErrorUnauthorizedExport, SessionExport], [ForceSessionExport]> = async ctx => {
	const user = ctx.ware.session.user();
	const session = ctx.ware.session.session();

	if (user === null || session === null) {
		return ctx.ware.error_unauthorized.signal();
	}

	ctx.ware.force_session = {
		user() {
			return user;
		},
		session() {
			return session;
		}
	};

	const response = await ctx.next();

	return response;
};

