import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform"
import { Context, Data, Effect, Layer } from "effect"
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
 * import { Client } from "rest-api-client"
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
	 * import { Client } from "rest-api-client"
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
	 * import { Client } from "rest-api-client"
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
	 * import { Client } from "rest-api-client"
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
	 * import { Client } from "rest-api-client"
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

/**
 * Configuration service tag for base URL and access token.
 * Used by the layer to configure the HttpClient.
 *
 * @example
 * ```ts
 * import { Layer } from "effect"
 * import { Client } from "rest-api-client"
 *
 * const configLayer = Layer.succeed(Client.Config, {
 *   url: "https://api.example.com",
 *   accessToken: "ey..."
 * })
 * ```
 */
export class Config extends Context.Tag("@RestApiClient/Config")<
	Config,
	{ url: string; accessToken: string | undefined }
>() {}

/**
 * Effect Layer that provides HttpClient with base URL and bearer token configuration.
 * Automatically prepends base URL to relative URLs and adds bearer token to requests.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Client } from "rest-api-client"
 * import { FetchHttpClient } from "@effect/platform"
 *
 * const getTodo = Client.get({ url: "/todos/1" })
 * const program = Effect.gen(function* () {
 *   const todo = yield* getTodo()
 *   return todo
 * })
 *
 * const layer = Client.layer.pipe(Layer.provide([FetchHttpClient.layer, Layer.succeed(Client.Config, { url: "https://api.example.com", accessToken: "token" })]))
 *
 * program.pipe(
 *   Effect.provide(layer),
 *   Effect.runPromise
 * )
 * ```
 */
export const layer = Layer.effect(
	HttpClient.HttpClient,
	Effect.gen(function* () {
		const config = yield* Config

		const client = (yield* HttpClient.HttpClient).pipe(
			// set the base url to the request url if it starts with a slash
			HttpClient.mapRequestInput((req) =>
				req.url.startsWith("/") ? req.pipe(HttpClientRequest.setUrl(config.url + req.url)) : req
			),
			// set the bearer token to the request headers if the session is present
			HttpClient.mapRequestInput((req) =>
				config.accessToken ? req.pipe(HttpClientRequest.bearerToken(config.accessToken)) : req
			)
		)

		return client
	})
).pipe(Layer.provide(FetchHttpClient.layer))

/**
 * Creates a Layer providing HttpClient with the given configuration.
 * Convenience function that combines the base layer with config and FetchHttpClient.
 *
 * @param config - Configuration object with base URL and optional access token
 * @returns A Layer providing HttpClient configured with the given settings
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Client } from "rest-api-client"
 *
 * const getTodo = Client.get({ url: "/todos/1" })
 * const program = Effect.gen(function* () {
 *   const todo = yield* getTodo()
 *   return todo
 * })
 *
 * program.pipe(
 *   Effect.provide(Client.layerConfig({ url: "https://api.example.com", accessToken: "token" })),
 *   Effect.runPromise
 * )
 * ```
 */
export const layerConfig = (config: Context.Tag.Service<Config>) =>
	layer.pipe(Layer.provide([FetchHttpClient.layer, Layer.succeed(Config, config)]))

/**
 * Creates a factory function that returns a Client instance with default headers and error handling.
 * This factory function is designed to be used with `Effect.Service`'s `sync` constructor.
 * The returned factory function `() => ({ client: new Client(...) })` can be passed directly to `sync`.
 *
 * @template DefaultHeaders - Default headers type for routes created by the client
 * @template DefaultError - Default error parser type for routes created by the client
 * @param config - Client configuration with optional headers and error handler
 * @returns A factory function that returns an object with a `client` property containing a Client instance
 *
 * @example
 * ```ts
 * import { Effect, Schema, Layer } from "effect"
 * import { Client } from "rest-api-client"
 * import { HttpClientResponse } from "@effect/platform"
 *
 * class ApiClient extends Effect.Service<ApiClient>()("@app/ApiClient", {
 *   sync: Client.make({
 *     error: (res: HttpClientResponse.HttpClientResponse) =>
 *       Effect.fail(new Error(`Request failed: ${res.status}`))
 *   }),
 *   accessors: true,
 * }) {}
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* ApiClient.client
 *   const todo = yield* client.get({ url: "/todos/1", response: Schema.Any })
 *   return todo
 * })
 *
 * program.pipe(
 *   Effect.provide(
 *     Layer.merge(ApiClient.Default, Client.layerConfig({ url: "https://api.example.com", accessToken: "token" }))
 *   ),
 *   Effect.runPromise
 * )
 * ```
 */

export const make =
	<DefaultHeaders extends MakerHeaders = never, DefaultError extends MakerError = never>(config: {
		headers?: DefaultHeaders
		error?: DefaultError
	}) =>
	() => ({ client: new Client({ headers: config.headers, error: config.error }) })

export { del, get, post, put } from "./make"
