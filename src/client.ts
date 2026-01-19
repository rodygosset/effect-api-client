import { Data } from "effect"
import type { MakerError } from "./error"
import type { MakerHeaders } from "./headers"
import type { MakerInput } from "./input"
import * as Make from "./make"
import type { MakerOutput } from "./output"
import type { MakerUrl } from "./url"

/**
 * Reusable client with default headers and error functions.
 * Routes created via this client inherit the default headers and error functions.
 *
 * @template DefaultHeaders - Default headers type for all routes created by this client
 * @template DefaultError - Default error parser type for all routes created by this client
 *
 * @example
 * ```ts
 * import { Headers } from "@effect/platform"
 * import { Schema } from "effect"
 * import { Client } from "effect-api-client"
 *
 * const Todo = Schema.Struct({ id: Schema.String, description: Schema.String, completed: Schema.Boolean })
 * const ErrorSchema = Schema.Struct({ message: Schema.String })
 * const client = new Client.Client({
 *   headers: Headers.fromInput({ "X-API-Version": "v1" }),
 *   error: ErrorSchema
 * })
 * const getTodo = client.get({ url: "/todos/1", response: Todo })
 * ```
 */
export class Client<
	DefaultHeaders extends MakerHeaders = never,
	DefaultError extends MakerError = never
> extends Data.TaggedClass("@RestApiClient/Client")<{
	headers?: DefaultHeaders
	error?: DefaultError
}> {
	/**
	 * Creates a GET request function.
	 *
	 * @template U - URL maker type (static string or dynamic function)
	 * @template H - Headers maker type (defaults to DefaultHeaders)
	 * @template O - Output parser type (defaults to never)
	 * @template E - Error parser type (defaults to DefaultError)
	 * @param spec - GET request specification
	 * @returns A function that executes the GET request and returns an Effect
	 *
	 * @example
	 * ```ts
	 * import { Effect, Schema } from "effect"
	 * import { Client } from "effect-api-client"
	 *
	 * const Todo = Schema.Struct({ id: Schema.String })
	 * const client = new Client.Client()
	 * const getTodo = client.get({ url: "/todos/1", response: Todo })
	 * const test = Effect.gen(function* () {
	 *   const todo = yield* getTodo()
	 *   return todo
	 * })
	 * ```
	 */
	get = <
		U extends MakerUrl,
		H extends MakerHeaders = DefaultHeaders,
		O extends MakerOutput = never,
		E extends MakerError = DefaultError
	>(
		spec: Make.GetMakerSpec<U, H, O, E>
	) => Make.get({ headers: this.headers, error: this.error, ...spec } as Make.GetMakerSpec<U, H, O, E>)

	/**
	 * Creates a POST request function.
	 *
	 * @template U - URL maker type (static string or dynamic function)
	 * @template H - Headers maker type (defaults to DefaultHeaders)
	 * @template I - Input encoder type (defaults to never)
	 * @template O - Output parser type (defaults to never)
	 * @template E - Error parser type (defaults to DefaultError)
	 * @param spec - POST request specification
	 * @returns A function that executes the POST request and returns an Effect
	 *
	 * @example
	 * ```ts
	 * import { Effect, Schema } from "effect"
	 * import { Client } from "effect-api-client"
	 *
	 * const NewTodo = Schema.Struct({ title: Schema.String })
	 * const Todo = Schema.Struct({ id: Schema.String, title: Schema.String })
	 * const client = new Client.Client()
	 * const createTodo = client.post({ url: "/todos", body: NewTodo, response: Todo })
	 * const test = Effect.gen(function* () {
	 *   const todo = yield* createTodo({ body: { title: "My Todo" } })
	 *   return todo
	 * })
	 * ```
	 */
	post = <
		U extends MakerUrl,
		H extends MakerHeaders = DefaultHeaders,
		I extends MakerInput = never,
		O extends MakerOutput = never,
		E extends MakerError = DefaultError
	>(
		spec: Make.PostMakerSpec<U, H, I, O, E>
	) => Make.post({ headers: this.headers, error: this.error, ...spec } as Make.PostMakerSpec<U, H, I, O, E>)

	/**
	 * Creates a PUT request function.
	 *
	 * @template U - URL maker type (static string or dynamic function)
	 * @template H - Headers maker type (defaults to DefaultHeaders)
	 * @template I - Input encoder type (defaults to never)
	 * @template O - Output parser type (defaults to never)
	 * @template E - Error parser type (defaults to DefaultError)
	 * @param spec - PUT request specification
	 * @returns A function that executes the PUT request and returns an Effect
	 *
	 * @example
	 * ```ts
	 * import { Effect, Schema } from "effect"
	 * import { Client } from "effect-api-client"
	 *
	 * const UpdateTodo = Schema.Struct({ title: Schema.String })
	 * const client = new Client.Client()
	 * const updateTodo = client.put({ url: "/todos/1", body: UpdateTodo })
	 * const test = Effect.gen(function* () {
	 *   const todo = yield* updateTodo({ body: { title: "Updated" } })
	 *   return todo
	 * })
	 * ```
	 */
	put = <
		U extends MakerUrl,
		H extends MakerHeaders = DefaultHeaders,
		I extends MakerInput = never,
		O extends MakerOutput = never,
		E extends MakerError = DefaultError
	>(
		spec: Make.PutMakerSpec<U, H, I, O, E>
	) => Make.put({ headers: this.headers, error: this.error, ...spec } as Make.PutMakerSpec<U, H, I, O, E>)

	/**
	 * Creates a DELETE request function.
	 *
	 * @template U - URL maker type (static string or dynamic function)
	 * @template H - Headers maker type (defaults to DefaultHeaders)
	 * @template I - Input encoder type (defaults to never)
	 * @template O - Output parser type (defaults to never)
	 * @template E - Error parser type (defaults to DefaultError)
	 * @param spec - DELETE request specification
	 * @returns A function that executes the DELETE request and returns an Effect
	 *
	 * @example
	 * ```ts
	 * import { Effect } from "effect"
	 * import { Client } from "effect-api-client"
	 *
	 * const client = new Client.Client()
	 * const deleteTodo = client.del({ url: "/todos/1" })
	 * const test = Effect.gen(function* () {
	 *   yield* deleteTodo()
	 * })
	 * ```
	 */
	del = <
		U extends MakerUrl,
		H extends MakerHeaders = DefaultHeaders,
		I extends MakerInput = never,
		O extends MakerOutput = never,
		E extends MakerError = DefaultError
	>(
		spec: Make.DelMakerSpec<U, H, I, O, E>
	) => Make.del({ headers: this.headers, error: this.error, ...spec } as Make.DelMakerSpec<U, H, I, O, E>)
}

export { del, get, post, put } from "./make"
