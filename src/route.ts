import type { HttpMethod } from "@effect/platform/HttpMethod"
import { Data } from "effect"
import type { Url } from "./url"
import type { Headers } from "./headers"
import type { Input } from "./input"
import type { Output } from "./output"
import type { Error } from "./error"
import type { InferFnRequirements } from "./utils"

/**
 * Internal representation of an HTTP route specification.
 * Contains method, URL, headers, body, response, and error parsers.
 *
 * @template M - HTTP method type
 * @template U - URL representation type
 * @template H - Headers representation type
 * @template I - Input representation type
 * @template O - Output representation type
 * @template E - Error representation type
 *
 * @example
 * ```ts
 * import { Route, Url, Output } from "effect-api-client"
 * import { Schema } from "effect"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const route = new Route.Route({
 *   method: "GET",
 *   url: Url.value("/todos/1"),
 *   response: Output.schema(Todo)
 * })
 * ```
 */
export class Route<
	M extends HttpMethod,
	U extends Url,
	H extends Headers = never,
	I extends Input = never,
	O extends Output = never,
	E extends Error = never
> extends Data.TaggedClass("@RestApiClient/Route")<{
	url: U
	method: M
	headers?: H
	body?: I
	response?: O
	error?: E
}> {}

export type InferRouteRequirements<
	H extends Headers = never,
	I extends Input = never,
	O extends Output = never,
	E extends Error = never
> = InferFnRequirements<H> | InferFnRequirements<I> | InferFnRequirements<O> | InferFnRequirements<E>
