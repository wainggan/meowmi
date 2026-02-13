import { Validated } from "shared/validate.ts";
import api_schema from "shared/api.schema.ts";
import { Shared } from "./shared.ts";
import { Miss } from "shared/utility.ts";

import catloot from "shared/data.loot.ts";
import * as catdefs_util from "./db/catdefs.util.ts";
import { User } from "./db/db.types.ts";

const gacha_pull = async (shared: Shared, user: User, input: Validated<typeof api_schema.gacha_pull_in>):
	Promise<Validated<typeof api_schema.gacha_pull_out>> =>
{
	input;

	if (user.tokens <= 0) {
		return {
			status: 'err',
			code: 'unauthorized',
			message: `not enough tokens`,
		};
	}

	const breed = catdefs_util.select(Object.values(shared.catdefs), catloot.base);

	const catinst_id = await shared.db.catinst_add(breed.id, user.id);
	if (catinst_id instanceof Miss) {
		if (catinst_id.type === 'not_found') {
			return {
				status: 'err',
				code: 'internal_error',
				message: `user no longer exists ??`,
			};
		}
		else if (catinst_id.type === 'internal') {
			return {
				status: 'err',
				code: 'internal_error',
				message: `unknown internal error`,
			};
		}
		else {
			throw catinst_id.type satisfies never;
		}
	}

	user.tokens = Math.max(user.tokens - 1, 0);

	const result_update = await shared.db.user_set(user);
	if (result_update instanceof Miss) {
		return {
			status: 'err',
			code: 'internal_error',
			message: `unknown internal error`,
		};
	}

	return {
		status: 'ok',
		pull: [catinst_id],
	};
}

const cat_list = async (shared: Shared, input: Validated<typeof api_schema.cat_list_in>):
	Promise<Validated<typeof api_schema.cat_list_out>> =>
{
	const user = await shared.db.user_get_name(input.username);
	if (user instanceof Miss) {
		if (user.type === 'not_found') {
			return {
				status: 'err',
				code: 'not_found',
				message: `username ${input.username} does not exist.`,
			};
		}
		else if (user.type === 'internal') {
			return {
				status: 'err',
				code: 'internal_error',
				message: user.message,
			};
		}
		else {
			throw user.type satisfies never;
		}
	}

	const input_id = user.id;

	const input_limit = Math.min(Math.max(Number(input.limit), 0), 40);
	const input_offset = Math.max(Number(input.offset), 0);

	const list = await shared.db.catinst_list_user(input_id, input.query, input_limit, input_offset);
	if (list instanceof Miss) {
		return {
			status: 'err',
			code: 'internal_error',
			message: `internal error`,
		};
	}

	const mapped = list.values()
		.map(x => {
			const def = shared.catdefs[x.catdef_id];
			return {
				inst: {
					id: x.id,
					name: x.name,
				},
				def: {
					name: def.name,
					rarity: def.rarity,
				},
			};
		})
		.toArray();

	return {
		status: 'ok',
		list: mapped,
	};
};

const tradelocal_new = async (shared: Shared, user: User | null, input: Validated<typeof api_schema.tradelocal_new_in>):
	Promise<Validated<typeof api_schema.tradelocal_new_out>> =>
{
	let creator_user_id;

	if (input.session !== null) {
		const session_user = await shared.db.session_get(input.session);
		if (session_user instanceof Miss) {
			if (session_user.type === 'not_found') {
				return {
					status: 'err',
					code: 'unauthorized',
					message: `invalid 'session' key`,
				};
			}
			else if (session_user.type === 'internal') {
				return {
					status: 'err',
					code: 'internal_error',
					message: `internal error`,
				};
			}
			else {
				throw session_user.type satisfies never;
			}
		}

		creator_user_id = session_user.user_id;
	}
	else if (user !== null) {
		creator_user_id = user.id;
	}
	else {
		return {
			status: 'err',
			code: 'bad_request',
			message: `request is missing both 'session' key and session cookie`,
		};
	}

	const result = await shared.db.tradelocal_new(creator_user_id, input.target_user_id, input.creator_cat_id, input.target_cat_id);
	if (result instanceof Miss) {
		if (result.type === 'internal') {
			return {
				status: 'err',
				code: 'internal_error',
				message: `internal error`,
			};
		}
		else {
			throw result.type satisfies never;
		}
	}

	return {
		status: 'ok',
		trade_id: result,
	};
};

const tradelocal_complete = async (shared: Shared, user: User | null, input: Validated<typeof api_schema.tradelocal_complete_in>):
	Promise<Validated<typeof api_schema.tradelocal_complete_out>> =>
{
	let user_id;

	if (input.session !== null) {
		const session_user = await shared.db.session_get(input.session);
		if (session_user instanceof Miss) {
			if (session_user.type === 'not_found') {
				return {
					status: 'err',
					code: 'unauthorized',
					message: `invalid 'session' key`,
				};
			}
			else if (session_user.type === 'internal') {
				return {
					status: 'err',
					code: 'internal_error',
					message: `internal error`,
				};
			}
			else {
				throw session_user.type satisfies never;
			}
		}

		user_id = session_user.user_id;
	}
	else if (user !== null) {
		user_id = user.id;
	}
	else {
		return {
			status: 'err',
			code: 'bad_request',
			message: `request is missing both 'session' key and session cookie`,
		};
	}

	// first, get the trade data.

	const result_tradelocal = await shared.db.tradelocal_get(input.trade_id);
	if (result_tradelocal instanceof Miss) {
		if (result_tradelocal.type === 'not_found') {
			return {
				status: 'err',
				code: 'not_found',
				message: `trade with id '${input.trade_id}' could not be found.`,
			}
		}
		else if (result_tradelocal.type === 'internal') {
			return {
				status: 'err',
				code: 'internal_error',
				message: `internal error`,
			};
		}
		else {
			throw result_tradelocal.type satisfies never;
		}
	}

	// only the target user can make a completion request to this trade.
	// if a different user attempts to complete, bail.
	if (result_tradelocal.peer_y_id !== user_id) {
		return {
			status: 'err',
			code: 'unauthorized',
			message: `you are unauthorized to close this trade.`,
		};
	}

	// the trade is a go!

	let result: Validated<typeof api_schema.tradelocal_complete_out>;

	exit: {
		// get both cats.
		const cat_x = await shared.db.catinst_get(result_tradelocal.catinst_x_id);
		const cat_y = await shared.db.catinst_get(result_tradelocal.catinst_y_id);

		if (cat_x instanceof Miss) {
			if (cat_x.type === 'not_found') {
				result = {
					status: 'err',
					code: 'unauthorized',
					message: `the trade creator's cat does not exist.`,
				};
			}
			else if (cat_x.type === 'internal') {
				result = {
					status: 'err',
					code: 'internal_error',
					message: `internal error`,
				};
			}
			else {
				throw cat_x.type satisfies never;
			}

			// if for any reason, either of the cats are invalid, then we bail immediately.
			// we break out using a label so given any error case, we always delete the trade at the end.
			break exit;
		}

		if (cat_y instanceof Miss) {
			if (cat_y.type === 'not_found') {
				result = {
					status: 'err',
					code: 'unauthorized',
					message: `the trade creator's cat does not exist.`,
				};
			}
			else if (cat_y.type === 'internal') {
				result = {
					status: 'err',
					code: 'internal_error',
					message: `internal error`,
				};
			}
			else {
				throw cat_y.type satisfies never;
			}

			break exit;
		}

		// transfer ownership between cats.

		{
			const temp = cat_x.owner_user_id;
			cat_x.owner_user_id = cat_y.owner_user_id;
			cat_y.owner_user_id = temp;
		}

		// update cats.

		const result_status_x = await shared.db.catinst_set(cat_x);
		const result_status_y = await shared.db.catinst_set(cat_y);

		if (result_status_x instanceof Miss) {
			if (result_status_x.type === 'internal') {
				result = {
					status: 'err',
					code: 'internal_error',
					message: `internal error.`,
				};
			}
			else {
				throw result_status_x.type satisfies never;
			}

			break exit;
		}

		if (result_status_y instanceof Miss) {
			if (result_status_y.type === 'internal') {
				result = {
					status: 'err',
					code: 'internal_error',
					message: `internal error.`,
				};
			}
			else {
				throw result_status_y.type satisfies never;
			}

			break exit;
		}

		result = {
			status: 'ok',
		};
	}
	
	// delete trade.

	const result_status_delete = await shared.db.tradelocal_delete(result_tradelocal.id);
	if (result_status_delete instanceof Miss) {
		if (result_status_delete.type === 'not_found') {
			// likely, the only chance this runs is if the target somehow sent two completions at the same time.
			// because of this, we return an internal error.
			return {
				status: 'err',
				code: 'internal_error',
				message: `internal error.`,
			};
		}
		else if (result_status_delete.type === 'internal') {
			return {
				status: 'err',
				code: 'internal_error',
				message: `internal error.`,
			};
		}
		else {
			throw result_status_delete.type satisfies never;
		}
	}

	// everything is okay :3

	return result;
};

export default {
	gacha_pull,
	cat_list,
	tradelocal_new,
	tradelocal_complete,
};

