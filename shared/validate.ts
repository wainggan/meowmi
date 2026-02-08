// deno-lint-ignore-file no-explicit-any

class Vdj<T extends Point> {
	constructor(schema: T) {
		this.#schema = schema;
	}

	#schema: T;

	validate(check: any): check is Value<T> {
		return this.#schema.validate(check);
	}
}

class VdjAny {
	type: 'any' = 'any';

	validate(_check: any): _check is any {
		return true;
	}
}

class VdjOptional {
	type: 'optional' = 'optional';

	validate(check: any): check is undefined {
		return check === undefined;
	}
}

type VdjObjectSchema = {
	[key: string]: Point[];
};

class VdjObject<T extends VdjObjectSchema> {
	constructor(init: T) {
		this.#shape = init;
	}

	type: 'object' = 'object';

	validate(check: any): check is T {
		if (typeof check !== 'object') {
			return false;
		}

		if (check === null) {
			return false;
		}

		const keys = Object.keys(this.#shape) as (keyof T)[];

		for (const schema_key of keys) {
			const schema_value = this.#shape[schema_key];

			const check_value = check[schema_key];

			let success = false;
			for (const against of schema_value) {
				if (against.validate(check_value)) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}
		}

		return true;
	}

	#shape: T;

	key<const K extends string, const V extends Point[]>(name: K, ...points: V):
		VdjObject<T & { [key in K]: V }>
	{
		// @ts-ignore this is okay
		this.#shape[name] = points;
		// @ts-ignore since we just set the object, we can return
		return this;
	}
}

type VdjInstanceSchema = {
	new (...args: any[]): any;
};

class VdjInstance<T extends VdjInstanceSchema> {
	type: 'instance' = 'instance';

	validate(check: any): check is InstanceType<T> {
		if (typeof check !== 'object') {
			return false;
		}

		if (this.#shape !== null) {
			let success = false;
			for (const against of this.#shape) {
				if (check instanceof against) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}
		}

		return true;
	}
	
	#shape: T[] | null = null;

	of<const V extends VdjInstanceSchema[]>(...value: V): VdjInstance<V[number]> {
		// @ts-ignore .
		this.#shape = value;
		return this;
	}
}

class VdjArray<T extends Point[]> {
	constructor(init: T) {
		this.#shape = init;
	}

	type: 'array' = 'array';

	validate(check: any): check is T {
		if (!Array.isArray(check)) {
			return false;
		}

		for (const value of check) {
			let success = false;
			for (const against of this.#shape) {
				if (against.validate(value)) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}
		}

		return true;
	}

	#shape: T;

	values<const P extends Point[]>(...points: P): VdjArray<P> {
		// @ts-ignore .
		this.#shape = points;
		// @ts-ignore .
		return this;
	}
}

class VdjTuple<T extends Point[][]> {
	constructor(init: T) {
		this.#shape = init;
	}

	type: 'tuple' = 'tuple';

	validate(check: any): check is T {
		if (!Array.isArray(check)) {
			return false;
		}

		if (check.length !== this.#shape.length) {
			return false;
		}

		for (let i = 0; i < this.#shape.length; i++) {
			const shape_index = this.#shape[i];
			const check_index = check[i];

			let success = false;
			for (const against of shape_index) {
				if (against.validate(check_index)) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}
		}

		return true;
	}

	#shape: T;

	then<const P extends Point[]>(...points: P): VdjTuple<[...T, P]> {
		this.#shape.push(points);
		// @ts-ignore .
		return this;
	}
}

class VdjNumber {
	type: 'number' = 'number';

	validate(check: any): check is number {
		if (typeof check !== 'number') {
			return false;
		}

		if (this.#nonan) {
			if (Number.isNaN(check)) {
				return false;
			}
		}

		if (this.#noinfinite) {
			if (!Number.isFinite(check)) {
				return false;
			}
		}

		if (this.#integer) {
			if (!Number.isInteger(check)) {
				return false;
			}
		}

		if (this.#range_0 !== null && this.#range_1 !== null) {
			if (check < this.#range_0 && this.#range_1 <= check) {
				return false;
			}
		}

		if (this.#positive) {
			if (check < 0) {
				return false;
			}
		}

		if (this.#negative) {
			if (check > 0) {
				return false;
			}
		}

		return true;
	}

	#range_0: number | null = null;
	#range_1: number | null = null;
	range(x0: number, x1: number): this {
		this.#range_0 = x0;
		this.#range_1 = x1;
		return this;
	}

	#nonan: boolean = false;
	nonan(): this {
		this.#nonan = true;
		return this;
	}

	#noinfinite: boolean = false;
	noinf(): this {
		this.#noinfinite = true;
		return this;
	}

	#integer: boolean = false;
	integer(): this {
		this.#integer = true;
		return this;
	}

	#negative: boolean = false;
	negative(): this {
		this.#negative = true;
		return this;
	}

	#positive: boolean = false;
	positive(): this {
		this.#positive = true;
		return this;
	}
}

class VdjString<T extends string> {
	type: 'string' = 'string';

	validate(check: any): check is T {
		if (typeof check !== 'string') {
			return false;
		}

		if (this.#exact !== null) {
			let success = false;
			for (const against of this.#exact) {
				if (check === against) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}
		}

		if (this.#regex !== null) {
			if (!this.#regex.test(check)) {
				return false;
			}
		}

		return true;
	}

	#exact: null | T[] = null;
	exact<const U extends string>(...values: U[]): VdjString<U> {
		// @ts-ignore .
		this.#exact = values;
		// @ts-ignore .
		return this;
	}

	#regex: RegExp | null = null;
	regex(value: RegExp): this {
		this.#regex = value;
		return this;
	}
}

class VdjNull {
	type: 'null' = 'null';

	validate(check: any): check is null {
		return check === null;
	}
}

type Point =
	| VdjObject<VdjObjectSchema>
	| VdjInstance<VdjInstanceSchema>
	| VdjArray<Point[]>
	| VdjTuple<Point[][]>
	| VdjNumber
	| VdjString<string>
	| VdjNull
	| VdjOptional
	| VdjAny;

type Value<T extends Point> =
	T extends VdjOptional
	? undefined
	: T extends VdjNull
	? null
	: T extends VdjAny
	? any
	: T extends VdjNumber
	? number
	: T extends VdjString<infer X>
	? X
	: T extends VdjObject<infer X>
	? {
		[key in keyof X]: Value<X[key][number]>;
	}
	: T extends VdjInstance<infer X>
	? InstanceType<X>
	: T extends VdjArray<infer X>
	? Value<X[number]>[]
	: T extends VdjTuple<infer X>
	? {
		[key in keyof X]: Value<X[key][number]>;
	}
	: never;

const vdj = {
	schema<const T extends Point>(schema: T): Vdj<T> {
		return new Vdj(schema);
	},
	null(): VdjNull {
		return new VdjNull();
	},
	object(): VdjObject<{}> {
		return new VdjObject({});
	},
	instance(): VdjInstance<VdjInstanceSchema> {
		return new VdjInstance();
	},
	array(): VdjArray<[]> {
		return new VdjArray([]);
	},
	tuple(): VdjTuple<[]> {
		return new VdjTuple([]);
	},
	number(): VdjNumber {
		return new VdjNumber();
	},
	string(): VdjString<string> {
		return new VdjString();
	},
	any(): VdjAny {
		return new VdjAny();
	},
	optional(): VdjOptional {
		return new VdjOptional();
	},
} as const;

export default vdj;

