
import catdefs from "./catdefs.data.ts";

const select_mem = new Map<keyof typeof catdefs.loot, number>();
export const select = (table: keyof typeof catdefs.loot): keyof typeof catdefs.map => {
	const loot = catdefs.loot[table];

	let total = select_mem.get(table);
	if (total === undefined) {
		total = 0;
		for (const i in catdefs.keys) {
			const ii = Number(i) as (typeof catdefs.keys)[number];
			const a = catdefs.map[ii];
			total += loot.rarities[a.rarity];
		}
		select_mem.set(table, total);
	}
	
	let value = Math.random() * total | 0;
	for (const i in catdefs.keys) {
		const ii = Number(i) as (typeof catdefs.keys)[number];
		const a = catdefs.map[ii];
		value -= loot.rarities[a.rarity];
		if (value <= 0) {
			return ii;
		}
	}

	throw new Error(`??`);
};

