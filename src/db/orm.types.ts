
export type Schema = {
	[name: string]: {
		[field: string]: {
			type:
				| 'int'
				| 'real'
				| 'text'
				| 'blob';
			key: boolean;
		}
	};
};

export interface ORMSelect<S extends Schema> {
	target<T extends keyof S, F extends keyof S[T]>(table: T, field: F | '*'): this;
	join<T extends keyof S, F extends keyof S[T]>(table: T, field: F | '*'): this;
}

export interface ORM<S extends Schema> {
	select(): ORMSelect<S>;
}

