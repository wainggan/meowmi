
export const rarity = [
	'common',
	'uncommon',
	'rare',
] as const;

export const themes_list = ['light', 'dark'] as const;

export type CatDefRarities =
	Exclude<Partial<typeof rarity>["length"], (typeof rarity)["length"]>

export type CatDefJson = {
	readonly key: string;
	readonly name: string;
	readonly rarity: number;
};

type Helper<T extends readonly [...unknown[]]> = {
	[key in keyof T]: number;
} & { length: T['length'] };

export type CatDefLoot = {
	readonly rarities: Helper<typeof rarity>;
	readonly specific: {
		readonly [key: string]: number;
	};
};

