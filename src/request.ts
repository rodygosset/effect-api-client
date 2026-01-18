import { Request, RequestResolver, Schema } from "effect"
import { FetchHttpClient, HttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"
import type { MakerError } from "./error"
import type { MakerHeaders } from "./headers"
import type { MakerInput } from "./input"
import * as Make from "./make"
import type { MakerOutput } from "./output"
import type { MakerUrl } from "./url"
import type { HttpMethod } from "@effect/platform/HttpMethod"
import * as Client from "./client"

/**
 * Helper function to declare both a tagged request class and a resolver for it from a maker spec.
 * This can be used in conjunction with Effect's request batching and caching capabilities.
 *
 * Creates a class that extends `Request.TaggedClass` with a static `resolver` property that can be used
 * with `Effect.request()` to execute HTTP requests.
 *
 * @template Tag - Unique string identifier for the request type (e.g., "app/GetTodos")
 * @template M - HTTP method type ("GET" | "POST" | "PUT" | "DELETE" | etc.)
 * @template U - URL maker type: either a static string or a function that takes params and returns a string
 * @template H - Headers maker type (defaults to `never` if no headers)
 * @template I - Input/body encoder type for request body (defaults to `never` if no body)
 * @template O - Output/response parser type for response body (defaults to `never` if no response parsing)
 * @template E - Error parser type for error responses (defaults to `never` if no error parsing)
 * @template L - Optional Layer type for providing HttpClient service (defaults to `never`)
 *
 * @param tag - Unique string tag identifying this request type
 * @param spec - Maker specification object containing method, url, headers, body, response, and error parsers
 * @param layer - Optional Layer that provides HttpClient service. When provided, removes HttpClient from the resolver's context requirements
 *
 * @returns A class constructor that:
 *   - Extends `Request.TaggedClass` with the given tag
 *   - Has a constructor that accepts params matching the MakerParams type
 *   - Has a static `resolver` property that is an Effect containing the RequestResolver
 *
 * @see {@link https://effect.website/docs/batching/#declaring-requests Effect Batching Documentation}
 *
 * @example
 * Simple GET request with static URL:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class GetTodos extends Request.Get("app/GetTodos", {
 *   spec: { url: "/todos", response: Todo.pipe(Schema.Array) }
 * }) {}
 *
 * const getTodos = Effect.request(new GetTodos(), GetTodos.resolver)
 * // Effect.Effect<readonly Todo[], ApiError | ..., HttpClient>
 * ```
 *
 * @example
 * GET request with dynamic URL and layer:
 * ```ts
 * import { Effect } from "effect"
 * import { FetchHttpClient } from "@effect/platform"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class GetTodo extends Request.Get("app/GetTodo", {
 *   spec: { url: (params: { id: string }) => `/todos/${params.id}`, response: Todo },
 *   layer: FetchHttpClient.layer // Provides HttpClient, removing it from dependencies
 * }) {}
 *
 * const getTodo = (id: string) =>
 *   Effect.request(new GetTodo({ url: { id } }), GetTodo.resolver)
 * // Effect.Effect<Todo, ApiError | ..., never> (no HttpClient dependency)
 * ```
 */
function TaggedClass<
	Tag extends string,
	M extends HttpMethod,
	U extends MakerUrl,
	H extends MakerHeaders = never,
	I extends MakerInput = never,
	O extends MakerOutput = never,
	E extends MakerError = never,
	L extends Layer.Layer<HttpClient.HttpClient> = never
>(tag: Tag, spec: Make.MakerSpec<M, U, H, I, O, E>, layer?: L) {
	const handler = Make.make(Make.toRoute(spec))

	type Success = Effect.Effect.Success<ReturnType<typeof handler>>
	type Error = Effect.Effect.Error<ReturnType<typeof handler>>
	type Context = Effect.Effect.Context<ReturnType<typeof handler>>

	type Params = Make.MakerParams<U, H, I>

	type A = { params: Params }

	type TaggedRequest = Request.Request<Success, Error> & Readonly<A> & { readonly _tag: Tag }

	type ResolverContext = [L] extends [never] ? Context : Exclude<Context, Layer.Layer.Success<L>>

	const resolver = RequestResolver.fromEffect(
		(req: Request.Request<Success, Error> & Readonly<A> & { readonly _tag: Tag }) => handler(req.params)
	).pipe(RequestResolver.contextFromEffect, Effect.provide(layer || Layer.empty))

	return class extends Request.TaggedClass(tag)<Success, Error, A> {
		constructor(params: Params) {
			super({ params })
		}
		static resolver = resolver
	} as (new (params: Params) => TaggedRequest) & {
		resolver: Effect.Effect<
			Effect.Effect.Success<typeof resolver>,
			Effect.Effect.Error<typeof resolver>,
			ResolverContext
		>
	}
}

/**
 * Creates a GET request class for use with Effect's request batching and caching.
 * GET requests cannot have a request body.
 *
 * @template Tag - Unique string identifier for the request type (e.g., "app/GetTodos")
 * @template U - URL maker type (static string or dynamic function)
 * @template DefaultHeaders - Default headers type for all requests created with the optional client
 * @template DefaultError - Default error parser type for all requests created with the optional client
 * @template H - Headers maker type (defaults to DefaultHeaders)
 * @template O - Output parser type (defaults to never)
 * @template E - Error parser type (defaults to DefaultError)
 * @template L - Optional Layer type for providing HttpClient service (defaults to never)
 *
 * @param tag - Unique string tag identifying this request type
 * @param props - Configuration object
 * @param props.spec - GET request specification with url, headers, response, and error parsers
 * @param props.client - Optional client instance providing default headers and error parsers
 * @param props.layer - Optional Layer that provides HttpClient service. When provided, removes HttpClient from the resolver's context requirements
 *
 * @returns A class constructor that:
 *   - Extends `Request.TaggedClass` with the given tag
 *   - Has a constructor that accepts params matching the MakerParams type
 *   - Has a static `resolver` property that is an Effect containing the RequestResolver
 *
 * @example
 * Simple GET request with static URL:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class GetTodos extends Request.Get("app/GetTodos", {
 *   spec: { url: "/todos", response: Todo.pipe(Schema.Array) }
 * }) {}
 *
 * const getTodos = Effect.request(new GetTodos(), GetTodos.resolver)
 * // Effect.Effect<readonly Todo[], ApiError | ..., HttpClient>
 * ```
 *
 * @example
 * GET request with dynamic URL:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class GetTodo extends Request.Get("app/GetTodo", {
 *   spec: { url: (params: { id: string }) => `/todos/${params.id}`, response: Todo }
 * }) {}
 *
 * const getTodo = (id: string) =>
 *   Effect.request(new GetTodo({ url: { id } }), GetTodo.resolver)
 * ```
 *
 * @example
 * GET request with layer to provide HttpClient:
 * ```ts
 * import { Effect } from "effect"
 * import { FetchHttpClient } from "@effect/platform"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class GetTodo extends Request.Get("app/GetTodo", {
 *   spec: { url: (params: { id: string }) => `/todos/${params.id}`, response: Todo },
 *   layer: FetchHttpClient.layer // Provides HttpClient, removing it from dependencies
 * }) {}
 *
 * const getTodo = (id: string) =>
 *   Effect.request(new GetTodo({ url: { id } }), GetTodo.resolver)
 * // Effect.Effect<Todo, ApiError | ..., never> (no HttpClient dependency)
 * ```
 */
export const Get = <
	Tag extends string,
	U extends MakerUrl,
	DefaultHeaders extends MakerHeaders = never,
	DefaultError extends MakerError = never,
	H extends MakerHeaders = DefaultHeaders,
	O extends MakerOutput = never,
	E extends MakerError = DefaultError,
	L extends Layer.Layer<HttpClient.HttpClient> = never
>(
	tag: Tag,
	props: {
		spec: Make.GetMakerSpec<U, H, O, E>
		client?: Client.Client<DefaultHeaders, DefaultError>
		layer?: L
	}
) =>
	TaggedClass(
		tag,
		{ headers: props.client?.headers, error: props.client?.error, ...props.spec, method: "GET" },
		props.layer
	)

/**
 * Creates a POST request class for use with Effect's request batching and caching.
 * POST requests can include a request body.
 *
 * @template Tag - Unique string identifier for the request type (e.g., "app/CreateTodo")
 * @template U - URL maker type (static string or dynamic function)
 * @template DefaultHeaders - Default headers type for all requests created with the optional client
 * @template DefaultError - Default error parser type for all requests created with the optional client
 * @template H - Headers maker type (defaults to DefaultHeaders)
 * @template I - Input encoder type for request body (defaults to never)
 * @template O - Output parser type (defaults to never)
 * @template E - Error parser type (defaults to DefaultError)
 * @template L - Optional Layer type for providing HttpClient service (defaults to never)
 *
 * @param tag - Unique string tag identifying this request type
 * @param props - Configuration object
 * @param props.spec - POST request specification with url, headers, body, response, and error parsers
 * @param props.client - Optional client instance providing default headers and error parsers
 * @param props.layer - Optional Layer that provides HttpClient service. When provided, removes HttpClient from the resolver's context requirements
 *
 * @returns A class constructor that:
 *   - Extends `Request.TaggedClass` with the given tag
 *   - Has a constructor that accepts params matching the MakerParams type
 *   - Has a static `resolver` property that is an Effect containing the RequestResolver
 *
 * @example
 * POST request with body and response:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { NewTodo, Todo } from "./common"
 *
 * class CreateTodo extends Request.Post("app/CreateTodo", {
 *   spec: {
 *     url: "/todos",
 *     body: NewTodo,
 *     response: Todo
 *   }
 * }) {}
 *
 * const createTodo = (data: { title: string; description: string }) =>
 *   Effect.request(new CreateTodo({ body: data }), CreateTodo.resolver)
 * ```
 *
 * @example
 * POST request with dynamic URL:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class UpdateTodo extends Request.Post("app/UpdateTodo", {
 *   spec: {
 *     url: (params: { id: string }) => `/todos/${params.id}`,
 *     body: Todo,
 *     response: Todo
 *   }
 * }) {}
 *
 * const updateTodo = (id: string, data: { id: string; title: string; description: string }) =>
 *   Effect.request(new UpdateTodo({ url: { id }, body: data }), UpdateTodo.resolver)
 * ```
 */
export const Post = <
	Tag extends string,
	U extends MakerUrl,
	DefaultHeaders extends MakerHeaders = never,
	DefaultError extends MakerError = never,
	H extends MakerHeaders = DefaultHeaders,
	I extends MakerInput = never,
	O extends MakerOutput = never,
	E extends MakerError = DefaultError,
	L extends Layer.Layer<HttpClient.HttpClient> = never
>(
	tag: Tag,
	props: {
		spec: Make.PostMakerSpec<U, H, I, O, E>
		client?: Client.Client<DefaultHeaders, DefaultError>
		layer?: L
	}
) =>
	TaggedClass(
		tag,
		{ headers: props.client?.headers, error: props.client?.error, ...props.spec, method: "POST" },
		props.layer
	)

/**
 * Creates a PUT request class for use with Effect's request batching and caching.
 * PUT requests can include a request body.
 *
 * @template Tag - Unique string identifier for the request type (e.g., "app/UpdateTodo")
 * @template U - URL maker type (static string or dynamic function)
 * @template DefaultHeaders - Default headers type for all requests created with the optional client
 * @template DefaultError - Default error parser type for all requests created with the optional client
 * @template H - Headers maker type (defaults to DefaultHeaders)
 * @template I - Input encoder type for request body (defaults to never)
 * @template O - Output parser type (defaults to never)
 * @template E - Error parser type (defaults to DefaultError)
 * @template L - Optional Layer type for providing HttpClient service (defaults to never)
 *
 * @param tag - Unique string tag identifying this request type
 * @param props - Configuration object
 * @param props.spec - PUT request specification with url, headers, body, response, and error parsers
 * @param props.client - Optional client instance providing default headers and error parsers
 * @param props.layer - Optional Layer that provides HttpClient service. When provided, removes HttpClient from the resolver's context requirements
 *
 * @returns A class constructor that:
 *   - Extends `Request.TaggedClass` with the given tag
 *   - Has a constructor that accepts params matching the MakerParams type
 *   - Has a static `resolver` property that is an Effect containing the RequestResolver
 *
 * @example
 * PUT request with body and response:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 * import { Todo } from "./common"
 *
 * class UpdateTodo extends Request.Put("app/UpdateTodo", {
 *   spec: {
 *     url: (params: { id: string }) => `/todos/${params.id}`,
 *     body: Todo,
 *     response: Todo
 *   }
 * }) {}
 *
 * const updateTodo = (id: string, data: { id: string; title: string; description: string }) =>
 *   Effect.request(new UpdateTodo({ url: { id }, body: data }), UpdateTodo.resolver)
 * ```
 *
 * @example
 * PUT request with static URL:
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { Request } from "effect-api-client"
 *
 * const UpdateData = Schema.Struct({ title: Schema.String })
 * class UpdateResource extends Request.Put("app/UpdateResource", {
 *   spec: {
 *     url: "/resource",
 *     body: UpdateData
 *   }
 * }) {}
 *
 * const updateResource = (data: { title: string }) =>
 *   Effect.request(new UpdateResource({ body: data }), UpdateResource.resolver)
 * ```
 */
export const Put = <
	Tag extends string,
	U extends MakerUrl,
	DefaultHeaders extends MakerHeaders = never,
	DefaultError extends MakerError = never,
	H extends MakerHeaders = DefaultHeaders,
	I extends MakerInput = never,
	O extends MakerOutput = never,
	E extends MakerError = DefaultError,
	L extends Layer.Layer<HttpClient.HttpClient> = never
>(
	tag: Tag,
	props: {
		spec: Make.PutMakerSpec<U, H, I, O, E>
		client?: Client.Client<DefaultHeaders, DefaultError>
		layer?: L
	}
) =>
	TaggedClass(
		tag,
		{ headers: props.client?.headers, error: props.client?.error, ...props.spec, method: "PUT" },
		props.layer
	)

/**
 * Creates a DELETE request class for use with Effect's request batching and caching.
 * DELETE requests typically do not include a request body or response body.
 *
 * @template Tag - Unique string identifier for the request type (e.g., "app/DeleteTodo")
 * @template U - URL maker type (static string or dynamic function)
 * @template DefaultHeaders - Default headers type for all requests created with the optional client
 * @template DefaultError - Default error parser type for all requests created with the optional client
 * @template H - Headers maker type (defaults to DefaultHeaders)
 * @template I - Input encoder type for request body (defaults to never)
 * @template O - Output parser type (defaults to never)
 * @template E - Error parser type (defaults to DefaultError)
 * @template L - Optional Layer type for providing HttpClient service (defaults to never)
 *
 * @param tag - Unique string tag identifying this request type
 * @param props - Configuration object
 * @param props.spec - DELETE request specification with url, headers, body, response, and error parsers
 * @param props.client - Optional client instance providing default headers and error parsers
 * @param props.layer - Optional Layer that provides HttpClient service. When provided, removes HttpClient from the resolver's context requirements
 *
 * @returns A class constructor that:
 *   - Extends `Request.TaggedClass` with the given tag
 *   - Has a constructor that accepts params matching the MakerParams type
 *   - Has a static `resolver` property that is an Effect containing the RequestResolver
 *
 * @example
 * DELETE request with dynamic URL:
 * ```ts
 * import { Effect } from "effect"
 * import { Request } from "effect-api-client"
 *
 * class DeleteTodo extends Request.Del("app/DeleteTodo", {
 *   spec: {
 *     url: (params: { id: string }) => `/todos/${params.id}`
 *   }
 * }) {}
 *
 * const deleteTodo = (id: string) =>
 *   Effect.request(new DeleteTodo({ url: { id } }), DeleteTodo.resolver)
 * ```
 *
 * @example
 * DELETE request with static URL:
 * ```ts
 * import { Effect } from "effect"
 * import { Request } from "effect-api-client"
 *
 * class DeleteResource extends Request.Del("app/DeleteResource", {
 *   spec: {
 *     url: "/resource"
 *   }
 * }) {}
 *
 * const deleteResource = Effect.request(new DeleteResource(), DeleteResource.resolver)
 * ```
 */
export const Del = <
	Tag extends string,
	U extends MakerUrl,
	DefaultHeaders extends MakerHeaders = never,
	DefaultError extends MakerError = never,
	H extends MakerHeaders = DefaultHeaders,
	I extends MakerInput = never,
	O extends MakerOutput = never,
	E extends MakerError = DefaultError,
	L extends Layer.Layer<HttpClient.HttpClient> = never
>(
	tag: Tag,
	props: {
		spec: Make.DelMakerSpec<U, H, I, O, E>
		client?: Client.Client<DefaultHeaders, DefaultError>
		layer?: L
	}
) =>
	TaggedClass(
		tag,
		{ headers: props.client?.headers, error: props.client?.error, ...props.spec, method: "DELETE" },
		props.layer
	)
