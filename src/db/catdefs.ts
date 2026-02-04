
type CatDefRarities =
	| 'common'
	| 'uncommon'
	| 'rare';

type CatDef = {
	readonly name: string;
	readonly rarity: CatDefRarities;
};

type CatDefLoot = {
	readonly rarities: {
		readonly [key in CatDefRarities]: number;
	};
	readonly specific: {
		readonly [key in keyof typeof map]?: number;
	};
};

const map = {
	1: {
		name: 'basic',
		rarity: 'common',
	},
} as const satisfies Record<number, CatDef>;

const keys = Object.keys(map).map(x => Number(x)) as unknown as readonly (keyof typeof map)[];

const loot = {
	base: {
		rarities: {
			common: 8,
			uncommon: 4,
			rare: 2,
		},
		specific: {},
	},
} as const satisfies {
	readonly [key: string]: CatDefLoot;
};

export default {
	map,
	keys,
	loot,
};

