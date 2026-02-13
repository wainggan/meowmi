import { Validated } from "shared/validate.ts";
import api_schema from "shared/api.schema.ts";
import { Shared } from "./shared.ts";
import { Miss } from "shared/utility.ts";

import catloot from "shared/data.loot.ts";
import * as catdefs_util from "./db/catdefs.util.ts";
import { User } from "./db/db.types.ts";

const gacha_pull = async (shared: Shared, user: User, input: Validated<typeof api_schema.gacha_pull_in>):
	Promise<Validated<typeof api_schema.gacha_pull_out>> => {
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

const cat_list = async (shared: Shared, user: User, input: Validated<typeof api_schema.cat_list_in>):
	Promise<Validated<typeof api_schema.cat_list_out>> => {
	const input_id = Number(user.id);
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

export default {
	gacha_pull,
	cat_list,
};

