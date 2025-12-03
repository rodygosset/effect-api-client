import { Effect, Data, Schema as S } from "effect"
import { HttpClientResponse } from "@effect/platform"
import type { MakerSchema } from "./common"

/**
 * An Effect Schema used to parse responses.
 *
 * @template T - Effect Schema type for response parsing
 */
export class Schema<T extends MakerSchema = MakerSchema> extends Data.TaggedClass("@RestApiClient/Output/Schema")<{
	schema: T
}> {}

/**
 * Creates a Schema response parser.
 *
 * @template T - Effect Schema type for response parsing
 * @param schema - Effect Schema to use for parsing responses
 * @returns Internal representation of a Schema response parser
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { Output } from "rest-api-client"
 *
 * const Todo = Schema.Struct({ id: Schema.String, title: Schema.String })
 * const responseParser = Output.schema(Todo)
 * ```
 */
export const schema = <T extends MakerSchema>(schema: T) => new Schema({ schema })

/**
 * Function type for custom response processing.
 * Takes an HTTP response and returns an Effect that processes it.
 */
export type MakerOutputFn = (res: HttpClientResponse.HttpClientResponse) => Effect.Effect<any, any, any>

/**
 * Response processor that processes responses using a custom Effect function.
 *
 * @template T - Response processing function type
 */
export class Fn<T extends MakerOutputFn = MakerOutputFn> extends Data.TaggedClass("@RestApiClient/Output/Fn")<{
	fn: T
}> {}

/**
 * Creates a response processor from a custom Effect function.
 *
 * @template T - Response processing function type
 * @param fn - Function that processes HTTP response and returns an Effect
 * @returns A Fn response processor instance
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { HttpClientResponse } from "@effect/platform"
 * import { Output } from "rest-api-client"
 *
 * const responseProcessor = Output.fn((res: HttpClientResponse.HttpClientResponse) =>
 *   Effect.gen(function* () {
 *     const json = yield* res.json
 *     return { data: json, status: res.status }
 *   })
 * )
 * ```
 */
export const fn = <T extends MakerOutputFn>(fn: T) => new Fn({ fn })

/**
 * Internal output representation union type.
 */
export type Output = Schema | Fn

/**
 * Union type for response parsers: Schema or custom response processing function.
 *
 * @example
 * ```ts
 * import type { Output } from "rest-api-client"
 * import { Schema } from "effect"
 * import type { HttpClientResponse } from "@effect/platform"
 * import type { Effect } from "effect"
 *
 * type Output1 = Output.MakerOutput<typeof Schema.Struct({ id: Schema.String })>
 * type Output2 = Output.MakerOutput<(res: HttpClientResponse.HttpClientResponse) => Effect.Effect<any, never, never>>
 * ```
 */
export type MakerOutput = MakerSchema | MakerOutputFn

/**
 * Converts a MakerOutput to its internal Route representation.
 *
 * @template O - Generic output type (extends MakerOutput)
 * @param output - MakerOutput (static Schema or custom response processing function)
 * @returns Internal output representation
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { Output } from "rest-api-client"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * const outputParser = Output.fromMakerOutput(Todo)
 * ```
 */
export const fromMakerOutput = <O extends MakerOutput>(output: O) => (S.isSchema(output) ? schema(output) : fn(output))

/**
 * Converts a MakerOutput to its internal representation.
 *
 * @template O - Generic output type (extends MakerOutput)
 */
export type ToOutput<O extends MakerOutput> = O extends MakerSchema
	? Schema<O>
	: O extends MakerOutputFn
	? Fn<O>
	: never

/**
 * Infers the output type from a MakerOutput.
 *
 * @template O - Generic output type (extends MakerOutput)
 * @returns The inferred output type
 *
 * @example
 * ```ts
 * import type { Output } from "rest-api-client"
 * import { Schema } from "effect"
 *
 * const Todo = Schema.Struct({ id: Schema.String })
 * type OutputType = Output.InferOutput<typeof Todo>
 * // OutputType = { id: string }
 * ```
 */
export type InferOutput<O extends MakerOutput> = [O] extends [never]
	? HttpClientResponse.HttpClientResponse
	: O extends MakerOutputFn
	? Effect.Effect.Success<ReturnType<O>>
	: S.Schema.Type<O>
