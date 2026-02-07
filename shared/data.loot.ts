const _ = {
	base: {
		rarities: [
			8,
			4,
			2
		],
		specific: {},
	},
} as const satisfies {
	[key: string]: import('./types.ts').CatDefLoot;
};
export default _;
