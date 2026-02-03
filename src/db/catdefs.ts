
type CatDef = {
	readonly name: string;
};

const map = new Map<number, CatDef>();

map.set(0, {
	name: 'basic',
});

const keys = map.keys().toArray();

export default {
	map,
	keys,
};

