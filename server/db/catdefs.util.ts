
import { CatDef } from "./db.types.ts";
import { CatDefLoot } from "shared/types.ts";

const select_mem = new Map<CatDefLoot, number>();
export const select = (catdefs: CatDef[], table: CatDefLoot): CatDef => {
	let total = select_mem.get(table);
	if (total === undefined) {
		total = 0;
		for (let i = 0; i < catdefs.length; i++) {
			const a = catdefs[i];
			total += table.rarities[a.rarity];
		}
		select_mem.set(table, total);
	}
	
	let value = Math.random() * total | 0;
	for (let i = 0; i < catdefs.length; i++) {
		const a = catdefs[i];
		value -= table.rarities[a.rarity];
		if (value <= 0) {
			return a;
		}
	}

	throw new Error(`??`);
};

