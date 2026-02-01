export class Result<T, E> {
	private constructor(type: 'ok', value: T)
	private constructor(type: 'err', value: E)
	private constructor(type: 'ok' | 'err', value: T | E) {
		if (type === 'ok') {
			this.#ok = value as T;
		}
		else if (type === 'err') {
			this.#err = value as E;
		}
		else {
			throw new Error(`invalid type`);
		}
	}

	#ok?: T;
	#err?: E;

	static Ok<T, E>(value: T): Result<T, E> {
		return new Result('ok', value);
	}

	static Err<T, E>(value: E): Result<T, E> {
		return new Result('err', value);
	}

	is_ok(): boolean {
		return this.#ok !== undefined;
	}

	is_err(): boolean {
		return this.#err !== undefined;
	}

	ok(): T | undefined {
		return this.#ok;
	}

	err(): E | undefined {
		return this.#err;
	}

	unwrap(): T {
		const value = this.ok();
		if (value === undefined) {
			throw new Error(`unwrapped 'err' value`);
		}
		return value;
	}

	map<U>(fn: (value: T) => U): Result<U, E> {
		const value = this.ok();
		if (value !== undefined) {
			return Result.Ok(fn(value));
		}
		return this as unknown as Result<U, E>;
	}

	map_err<U>(fn: (value: E) => U): Result<T, U> {
		const value = this.err();
		if (value !== undefined) {
			return Result.Err(fn(value));
		}
		return this as unknown as Result<T, U>;
	}
}

export class Miss<E> {
	constructor(type: E, message: string) {
		this.#type = type;
		this.#message = message;
	}

	#type: E;
	#message: string;

	static create<E>(type: E, message: string): Miss<E> {
		return new Miss(type, message);
	}

	get type(): E {
		return this.#type;
	}

	get message(): string {
		return this.#message;
	}

	toError(): Error {
		return new Error(this.toString());
	}

	toString(): string {
		return `${this.#type}: ${this.#message}`;
	}
}

