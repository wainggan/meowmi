import { CatDef } from "./db.types.ts";

const rarity = [
	'common',
	'uncommon',
	'rare',
] as const;

export type CatDefRarities =
	Exclude<Partial<typeof rarity>["length"], (typeof rarity)["length"]>

const map = [
	{
		id: 0,
		name: "basic",
		rarity: 0,
	},
	{
		id: 1,
		name: "science",
		rarity: 0,
	},
] as const satisfies CatDef[];

type CatDefKeys =
	Exclude<Partial<typeof map>["length"], (typeof map)["length"]>

const loot = {
	base: {
		rarities: {
			0: 8,
			1: 4,
			2: 8,
		},
		specific: {},
	},
} as const satisfies {
	readonly [key: string]: CatDefLoot;
};

type CatDefLoot = {
	readonly rarities: {
		readonly [key in CatDefRarities]: number;
	};
	readonly specific: {
		readonly [key in CatDefKeys]?: number;
	};
};

export default {
	rarity,
	map,
	loot,
};

