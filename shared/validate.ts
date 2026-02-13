// deno-lint-ignore-file no-explicit-any

class Vdj<T extends Point> {
	constructor(schema: T) {
		this.#schema = schema;
	}

	#schema: T;

	validate(check: any): check is Calculate<T> {
		return this.#schema.validate(check);
	}
}

abstract class VdjShared {
	abstract type: string;
	abstract validate(check: any): boolean;
}

class VdjAny extends VdjShared {
	type: 'any' = 'any';

	validate(_check: any): boolean {
		return true;
	}
}

class VdjBoolean extends VdjShared {
	type: 'boolean' = 'boolean';

	validate(check: any): boolean {
		if (typeof check !== 'boolean') {
			return false;
		}

		return true;
	}
}

class VdjUndefined extends VdjShared {
	type: 'optional' = 'optional';

	validate(check: any): boolean {
		return check === undefined;
	}
}

class VdjEither<T extends Point[]> extends VdjShared {
	constructor(shape: T) {
		super();
		this.#shape = shape;
	}

	type: 'either' = 'either';

	validate(check: any): boolean {
		for (const against of this.#shape) {
			if (against.validate(check)) {
				return true;
			}
		}

		return false;
	}

	#shape: T;

	or<const U extends Point>(value: U): VdjEither<[...T, U]> {
		// @ts-ignore .
		this.#shape.push(value);
		// @ts-ignore .
		return this;
	}
}

type VdjObjectSchema = {
	[key: string]: Point[];
};

class VdjObject<T extends VdjObjectSchema> extends VdjShared {
	constructor(init: T) {
		super();
		this.#shape = init;
	}

	type: 'object' = 'object';

	validate(check: any): boolean {
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

class VdjInstance<T extends VdjInstanceSchema> extends VdjShared {
	type: 'instance' = 'instance';

	validate(check: any): boolean {
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

class VdjArray<T extends Point[]> extends VdjShared {
	constructor(init: T) {
		super();
		this.#shape = init;
	}

	type: 'array' = 'array';

	validate(check: any): boolean {
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

class VdjTuple<T extends Point[][]> extends VdjShared {
	constructor(init: T) {
		super();
		this.#shape = init;
	}

	type: 'tuple' = 'tuple';

	validate(check: any): boolean {
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

class VdjNumber<T extends number> extends VdjShared {
	type: 'number' = 'number';

	validate(check: any): boolean {
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

		return true;
	}

	#exact: null | T[] = null;
	exact<const U extends number>(...values: U[]): VdjNumber<U> {
		// @ts-ignore .
		this.#exact = values;
		// @ts-ignore .
		return this;
	}

	#range_0: number | null = null;
	#range_1: number | null = null;
	min(value: number): this {
		this.#range_0 = value;
		return this;
	}
	max(value: number): this {
		this.#range_1 = value;
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

class VdjString<T extends string> extends VdjShared {
	type: 'string' = 'string';

	validate(check: any): boolean {
		if (typeof check !== 'string') {
			return false;
		}

		if (this.#range_0 !== null) {
			if (check.length < this.#range_0) {
				return false;
			}
		}

		if (this.#range_1 !== null) {
			if (check.length > this.#range_1) {
				return false;
			}
		}

		if (this.#regex !== null) {
			if (!this.#regex.test(check)) {
				return false;
			}
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

	#range_0: number | null = null;
	#range_1: number | null = null;
	lenmin(value: number | null): this {
		this.#range_0 = value;
		return this;
	}
	lenmax(value: number | null): this {
		this.#range_1 = value;
		return this;
	}
}

class VdjNull {
	type: 'null' = 'null';

	validate(check: any): boolean {
		return check === null;
	}
}

type Point =
	| VdjObject<VdjObjectSchema>
	| VdjInstance<VdjInstanceSchema>
	| VdjArray<Point[]>
	| VdjTuple<Point[][]>
	| VdjBoolean
	| VdjNumber<number>
	| VdjString<string>
	| VdjNull
	| VdjUndefined
	| VdjEither<Point[]>
	| VdjAny;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6];

type Calculate<T extends Point, R extends number = 6> =
	R extends 0
	? never
	: T extends VdjUndefined
	? undefined
	: T extends VdjNull
	? null
	: T extends VdjAny
	? any
	: T extends VdjBoolean
	? boolean
	: T extends VdjNumber<infer X>
	? X
	: T extends VdjString<infer X>
	? X
	: T extends VdjObject<infer X>
	? {
		[key in keyof X]: Calculate<X[key][number], Prev[R]>;
	}
	: T extends VdjInstance<infer X>
	? InstanceType<X>
	: T extends VdjArray<infer X>
	? Calculate<X[number], Prev[R]>[]
	: T extends VdjTuple<infer X>
	? {
		[key in keyof X]: Calculate<X[key][number], Prev[R]>;
	}
	: T extends VdjEither<infer X>
	? Calculate<X[number], Prev[R]>
	: never;

export type Validated<T extends Vdj<Point>> =
	T extends Vdj<infer X>
	? Calculate<X>
	: never;

export default {
	schema<const T extends Point>(schema: T): Vdj<T> {
		return new Vdj(schema);
	},
	null(): VdjNull {
		return new VdjNull();
	},
	boolean(): VdjBoolean {
		return new VdjBoolean();
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
	number(): VdjNumber<number> {
		return new VdjNumber();
	},
	string(): VdjString<string> {
		return new VdjString();
	},
	any(): VdjAny {
		return new VdjAny();
	},
	optional(): VdjUndefined {
		return new VdjUndefined();
	},
	either(): VdjEither<[]> {
		return new VdjEither([]);
	},
} as const;

