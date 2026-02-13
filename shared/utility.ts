export class Result<T, E> {
	private constructor(type: true, value: T)
	private constructor(type: false, value: E)
	private constructor(type: boolean, value: T | E) {
		if (type) {
			this.#variant = true;
			this.#ok = value as T;
		}
		else {
			this.#variant = false;
			this.#err = value as E;
		}
	}

	#variant: boolean;
	#ok?: T;
	#err?: E;

	static Ok<T, E>(value: T): Result<T, E> {
		return new Result(true, value);
	}

	static Err<T, E>(value: E): Result<T, E> {
		return new Result(false, value);
	}

	clone(): Result<T, E> {
		if (this.#variant) {
			return new Result(true, this.#ok!);
		}
		else {
			return new Result(false, this.#err!);
		}
	}

	is_ok(): boolean {
		return this.#variant;
	}

	is_err(): boolean {
		return !this.#variant;
	}

	ok(): T | undefined {
		return this.#ok;
	}

	err(): E | undefined {
		return this.#err;
	}

	unwrap(): T {
		if (!this.#variant) {
			throw new Error(`unwrapped 'err' value`);
		}
		else {
			return this.#ok!;
		}
	}

	unwrap_or(value: T): T {
		if (!this.#variant) {
			return value;
		}
		else {
			return this.#ok!;
		}
	}

	unwrap_or_else(fn: () => T): T {
		if (!this.#variant) {
			return fn();
		}
		else {
			return this.#ok!;
		}
	}

	match(): [true, T] | [false, E] {
		if (this.#variant) {
			return [true, this.#ok!];
		}
		else {
			return [false, this.#err!];
		}
	}

	map<U>(fn: (value: T) => U): Result<U, E> {
		if (this.#variant) {
			// @ts-expect-error .
			this.#ok = fn(this.#ok!);
			// @ts-expect-error .
			return this;
		}
		else {
			return this as unknown as Result<U, E>;
		}
	}

	map_err<U>(fn: (value: E) => U): Result<T, U> {
		if (!this.#variant) {
			// @ts-expect-error .
			this.#err = fn(this.#err!);
			// @ts-expect-error .
			return this;
		}
		else {
			return this as unknown as Result<T, U>;
		}
	}

	and<U>(other: Result<U, E>): Result<U, E> {
		if (this.#variant) {
			return other;
		}
		else {
			return this as unknown as Result<U, E>;
		}
	}

	and_then<U>(fn: () => Result<U, E>): Result<U, E> {
		if (this.#variant) {
			return fn();
		}
		else {
			return this as unknown as Result<U, E>;
		}
	}

	or<F>(other: Result<T, F>): Result<T, F> {
		if (this.#variant) {
			return this as unknown as Result<T, F>;
		}
		else {
			return other;
		}
	}

	or_else<F>(other: () => Result<T, F>): Result<T, F> {
		if (this.#variant) {
			return this as unknown as Result<T, F>;
		}
		else {
			return other();
		}
	}

	flatmap<U>(fn: (value: T) => ([false] | [true, U])): Result<U, E> {
		if (this.#variant) {
			const out = fn(this.#ok!);
			if (out[0]) {
				// @ts-expect-error .
				this.#ok = out[1];
			}
		}
		
		return this as unknown as Result<U, E>;
	}

	toError(): Error {
		let str;
		if (this.#variant) {
			str = `ok`;
		}
		else {
			if (typeof this.#err === 'object' && this.#err !== null && 'toString' in this.#err) {
				str = "err: " + this.#err.toString();
			}
			else {
				str = `err`;
			}
		}
		return new Error(str);
	}

	toString(): string {
		return this.#variant ? 'Result(Ok)' : 'Result(Err)';
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

	static into_result<T, E>(value: T | Miss<E>): Result<T, Miss<E>> {
		if (value instanceof Miss) {
			return Result.Err(value);
		}
		return Result.Ok(value);
	}

	static from_result<T, E>(value: Result<T, Miss<E>>): T | Miss<E> {
		return value.match()[1];
	}

	static unwrap<T, E>(value: T | Miss<E>): T {
		if (value instanceof Miss) {
			throw value.toError();
		}
		return value;
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

