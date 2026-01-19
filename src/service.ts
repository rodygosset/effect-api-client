import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform"
import { Context, Data, Effect, Layer } from "effect"
import type { MakerError } from "./error"
import type { MakerHeaders } from "./headers"
import * as Client from "./client"
import type { MakerOutput } from "./output"
import type { MakerUrl } from "./url"
import * as Make from "./make"
import * as Request from "./request"
import type { MakerInput } from "./input"

/**
 * Configuration service tag for base URL and access token.
 * Used by the layer to configure the HttpClient.
 *
 * @example
 * ```ts
 * import { Layer } from "effect"
 * import { Service } from "effect-api-client"
 *
 * const configLayer = Layer.succeed(Service.Config, {
 *   url: "https://api.example.com",
 *   getAccessToken: Effect.succeed("ey...")
 * })
 * ```
 */
export class Config extends Context.Tag("@RestApiClient/Config")<
	Config,
	{ url: string; getAccessToken?: Effect.Effect<string | undefined, { _tag: string }> }
>() {}

/**
 * Effect Layer that provides HttpClient with base URL and bearer token configuration.
 * Automatically prepends base URL to relative URLs and adds bearer token to requests.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Client, Service } from "effect-api-client"
 * import { FetchHttpClient } from "@effect/platform"
 *
 * const getTodo = Client.get({ url: "/todos/1" })
 * const program = Effect.gen(function* () {
 *   const todo = yield* getTodo()
 *   return todo
 * })
 *
 * const layer = Service.layer.pipe(Layer.provide([FetchHttpClient.layer, Layer.succeed(Service.Config, { url: "https://api.example.com", getAccessToken: Effect.succeed("token") })]))
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
			HttpClient.mapRequestInputEffect((req) =>
				Effect.gen(function* () {
					const accessToken = config.getAccessToken ? yield* config.getAccessToken : undefined
					if (!accessToken) return req
					return req.pipe(HttpClientRequest.bearerToken(accessToken))
				}).pipe(Effect.catchAll(() => Effect.succeed(req)))
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
 * import { Client, Service } from "effect-api-client"
 *
 * const getTodo = Client.get({ url: "/todos/1" })
 * const program = Effect.gen(function* () {
 *   const todo = yield* getTodo()
 *   return todo
 * })
 *
 * program.pipe(
 *   Effect.provide(Service.layerConfig({ url: "https://api.example.com", getAccessToken: Effect.succeed("token") })),
 *   Effect.runPromise
 * )
 * ```
 */
export const layerConfig = (config: Context.Tag.Service<Config>) =>
	layer.pipe(Layer.provide([FetchHttpClient.layer, Layer.succeed(Config, config)]))

/**
 * Type alias for a function that takes parameters and returns an Effect.
 * Used to represent route functions that require dependencies to execute.
 *
 * @template P - Parameters type for the function
 * @template A - Success value type of the Effect
 * @template E - Error type of the Effect
 * @template R - Requirements (dependencies) type of the Effect
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Client } from "effect-api-client"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const getTodo: EffectFn<{ url: { id: string } }, Todo, never, HttpClient.HttpClient> =
 *   Client.get({ url: (params) => `/todos/${params.url.id}`, response: Todo })
 * ```
 */
type EffectFn<P, A, E, R> = (params: P) => Effect.Effect<A, E, R>

/**
 * Provides a Layer to an EffectFn, removing the layer's requirements from the returned function's requirements.
 * This lifts dependencies from the function level to the caller level, avoiding requirement leakage.
 *
 * @template P - Parameters type for the function
 * @template A - Success value type of the Effect
 * @template E - Error type of the Effect
 * @template R - Requirements type of the Effect (before providing the layer)
 * @template LA - Success value type provided by the Layer
 * @template LE - Error type of the Layer
 * @template LR - Requirements type of the Layer
 * @param fn - The EffectFn to provide the layer to
 * @param layer - The Layer to provide, satisfying some requirements in R
 * @returns A new function with reduced requirements (R without LR)
 *
 * @example
 * ```ts
 * import { Effect, Layer, Schema } from "effect"
 * import { Client, Service } from "effect-api-client"
 * import { HttpClient } from "@effect/platform"
 * import { FetchHttpClient } from "@effect/platform"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const getTodo = Client.get({ url: "/todos/1", response: Todo })
 *
 * const getTodoWithoutDeps = Service.provideFn(getTodo, FetchHttpClient.layer)
 * // getTodoWithoutDeps no longer requires HttpClient.HttpClient
 * ```
 */
export const provideFn =
	<P, A, E, R, LA, LE, LR>(fn: EffectFn<P, A, E, R>, layer: Layer.Layer<LA, LE, LR>) =>
	(params: P) =>
		fn(params).pipe(Effect.provide(layer))

/**
 * Type alias for a factory function that takes configuration and returns an EffectFn.
 * Used to represent client methods that create route functions based on configuration.
 *
 * @template C - Configuration type for the factory
 * @template P - Parameters type for the returned EffectFn
 * @template A - Success value type of the Effect
 * @template E - Error type of the Effect
 * @template R - Requirements (dependencies) type of the Effect
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { Client, Service } from "effect-api-client"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const client = new Client.Client()
 * const getFactory: Service.EffectFnFactory<
 *   { url: string; response: typeof Todo },
 *   void,
 *   Todo,
 *   never,
 *   HttpClient.HttpClient
 * > = (spec) => client.get(spec)
 * ```
 */
type EffectFnFactory<C, P, A, E, R> = (config: C) => EffectFn<P, A, E, R>

/**
 * Provides a Layer to an EffectFnFactory, removing the layer's requirements from the factory's returned functions.
 * This lifts dependencies from route functions to the service level, avoiding requirement leakage to consumers.
 *
 * @template C - Configuration type for the factory
 * @template P - Parameters type for the returned EffectFn
 * @template A - Success value type of the Effect
 * @template E - Error type of the Effect
 * @template R - Requirements type of the Effect (before providing the layer)
 * @template LA - Success value type provided by the Layer
 * @template LE - Error type of the Layer
 * @template LR - Requirements type of the Layer
 * @param factory - The EffectFnFactory to provide the layer to
 * @param layer - The Layer to provide, satisfying some requirements in R
 * @returns A new factory function that returns EffectFns with reduced requirements (R without LR)
 *
 * @example
 * ```ts
 * import { Effect, Layer, Schema } from "effect"
 * import { Client, Service } from "effect-api-client"
 * import { HttpClient } from "@effect/platform"
 * import { FetchHttpClient } from "@effect/platform"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const client = new Client.Client()
 * const getWithoutDeps = Service.provideFactory(client.get, FetchHttpClient.layer)
 * // getWithoutDeps returns functions that no longer require HttpClient.HttpClient
 * const getTodo = getWithoutDeps({ url: "/todos/1", response: Todo })
 * // ^ ? () => Effect.Effect<Todo, ..., never>
 * ```
 */
const provideFactory =
	<C, P, A, E, R, LA, LE, LR>(factory: EffectFnFactory<C, P, A, E, R>, layer: Layer.Layer<LA, LE, LR>) =>
	(config: C) =>
		provideFn(factory(config), layer)

/**
 * Creates an effect that returns a Client instance with default headers and error handling.
 * Lifts the HttpClient dependency from the client methods to the effect level, avoiding requirement leakage to consumers.
 * This effect is meant to be used with `Effect.Service`'s `effect` constructor.
 *
 * @template DefaultHeaders - Default headers type for routes created by the client
 * @template DefaultError - Default error parser type for routes created by the client
 * @param config - Client configuration with optional headers and error handler
 * @returns An effect that provides a Client instance where route functions no longer require HttpClient
 *
 * @example
 * ```ts
 * import { Effect, Schema, Layer } from "effect"
 * import { Client, Service } from "effect-api-client"
 * import { HttpClientResponse } from "@effect/platform"
 *
 * class ApiClient extends Effect.Service<ApiClient>()("@app/ApiClient", {
 *   effect: Service.make({
 *     error: (res: HttpClientResponse.HttpClientResponse) =>
 *       Effect.fail(new Error(`Request failed: ${res.status}`))
 *   }),
 *   // ApiClient requires HttpClient, provided via dependencies
 *   dependencies: [Service.layerConfig({ url: "https://api.example.com", getAccessToken: Effect.succeed("token") })],
 *   accessors: true,
 * }) {}
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* ApiClient.client
 *   // client.get() returns a function that no longer requires HttpClient
 *   const todo = yield* client.get({ url: "/todos/1", response: Schema.Struct({ id: Schema.String }) })()
 *   return todo
 * })
 *
 * program.pipe(
 *   Effect.provide(ApiClient.Default),
 *   Effect.runPromise
 * )
 * ```
 */

export const make = <DefaultHeaders extends MakerHeaders = never, DefaultError extends MakerError = never>(config?: {
	headers?: DefaultHeaders
	error?: DefaultError
}) =>
	Effect.gen(function* () {
		// lift the HttpClient dependency from the client methods to this effect
		// see: https://effect.website/docs/requirements-management/layers/#avoiding-requirement-leakage

		const httpClient = yield* HttpClient.HttpClient
		const layer = Layer.succeed(HttpClient.HttpClient, httpClient)

		const client = new Client.Client({ headers: config?.headers, error: config?.error })

		const get = provideFactory(client.get, layer)

		const post = provideFactory(client.post, layer)

		const put = provideFactory(client.put, layer)

		const del = provideFactory(client.del, layer)

		const Get = <
			Tag extends string,
			U extends MakerUrl,
			H extends MakerHeaders = DefaultHeaders,
			O extends MakerOutput = never,
			E extends MakerError = DefaultError
		>(
			tag: Tag,

			spec: Make.GetMakerSpec<U, H, O, E>
		) => Request.Get(tag, { spec: { headers: client.headers, error: client.error, ...spec }, layer })

		const Post = <
			Tag extends string,
			U extends MakerUrl,
			H extends MakerHeaders = DefaultHeaders,
			I extends MakerInput = never,
			O extends MakerOutput = never,
			E extends MakerError = DefaultError
		>(
			tag: Tag,
			spec: Make.PostMakerSpec<U, H, I, O, E>
		) => Request.Post(tag, { spec: { headers: client.headers, error: client.error, ...spec }, layer })

		const Put = <
			Tag extends string,
			U extends MakerUrl,
			H extends MakerHeaders = DefaultHeaders,
			I extends MakerInput = never,
			O extends MakerOutput = never,
			E extends MakerError = DefaultError
		>(
			tag: Tag,
			spec: Make.PutMakerSpec<U, H, I, O, E>
		) => Request.Put(tag, { spec: { headers: client.headers, error: client.error, ...spec }, layer })

		const Del = <
			Tag extends string,
			U extends MakerUrl,
			H extends MakerHeaders = DefaultHeaders,
			I extends MakerInput = never,
			O extends MakerOutput = never,
			E extends MakerError = DefaultError
		>(
			tag: Tag,
			spec: Make.DelMakerSpec<U, H, I, O, E>
		) => Request.Del(tag, { spec: { headers: client.headers, error: client.error, ...spec }, layer })

		return { client, get, post, put, del, Request: { Get, Post, Put, Del } }
	})
