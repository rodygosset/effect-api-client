import { Data, Effect, Schema as S } from "effect"
import { HttpClientResponse } from "@effect/platform"
import type { MakerSchema } from "./common"
import type { InferEffectError } from "./utils"

/**
 * An Effect Schema used to parse error responses.
 *
 * @template T - Effect Schema type
 */
export class Schema<T extends MakerSchema = MakerSchema> extends Data.TaggedClass("@RestApiClient/Error/Schema")<{
	schema: T
}> {}

/**
 * Creates a Schema error parser.
 *
 * @template T - Effect Schema type
 * @param schema - Effect Schema to use for parsing error responses
 * @returns A Schema error parser instance
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { Error } from "rest-api-client"
 *
 * const ErrorSchema = Schema.Struct({ message: Schema.String })
 * const errorParser = Error.schema(ErrorSchema)
 * ```
 */
export const schema = <T extends MakerSchema>(schema: T) => new Schema({ schema })

/**
 * Function type for custom error transformation.
 * Takes an HTTP response and returns the error value.
 */
export type MakerErrorFn = (res: HttpClientResponse.HttpClientResponse) => Effect.Effect<void | never, any, any>

/**
 * Error transformer that transforms responses using a custom function.
 *
 * @template T - Error transformation function type
 */
export class Fn<T extends MakerErrorFn = MakerErrorFn> extends Data.TaggedClass("@RestApiClient/Error/Fn")<{
	fn: T
}> {}

/**
 * Creates an error transformer from a custom function.
 *
 * @template T - Error transformation function type
 * @param fn - Function that transforms HTTP response to error value
 * @returns A Fn error transformer instance
 *
 * @example
 * ```ts
 * import { HttpClientResponse } from "@effect/platform"
 * import { Error } from "rest-api-client"
 *
 * const errorTransformer = Error.fn((res: HttpClientResponse.HttpClientResponse) => Effect.fail(new Error(`Request failed: ${res.status}`)))
 * ```
 */
export const fn = <T extends MakerErrorFn>(fn: T) => new Fn({ fn })

/**
 * Internal error representation union type.
 */
export type Error = Schema | Fn

/**
 * Union type for error parsers: Schema or function.
 *
 * @example
 * ```ts
 * import type { Error } from "rest-api-client"
 * import { Schema } from "effect"
 * import type { HttpClientResponse } from "@effect/platform"
 *
 * type Error1 = Error.MakerError<typeof Schema.Struct({ message: Schema.String })>
 * type Error2 = Error.MakerError<(res: HttpClientResponse.HttpClientResponse) => Effect.Effect<never, Error, never>>
 * ```
 */
export type MakerError = MakerSchema | MakerErrorFn

/**
 * Converts a MakerError to its internal representation.
 *
 * @template E - Error maker type
 */
export type ToError<E extends MakerError> = E extends MakerSchema ? Schema<E> : E extends MakerErrorFn ? Fn<E> : never

/**
 * Converts a MakerError to its internal Route representation.
 *
 * @template E - Error maker type
 * @param error - Error maker (Schema or function)
 * @returns Internal error representation
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { Error } from "rest-api-client"
 *
 * const ErrorSchema = Schema.Struct({ message: Schema.String })
 * const errorParser = Error.fromMakerError(ErrorSchema)
 * ```
 */
export const fromMakerError = <E extends MakerError>(error: E) => (S.isSchema(error) ? schema(error) : fn(error))

/**
 * Infers the error type from a MakerError.
 *
 * @template T - Error maker type
 * @returns The inferred error type
 *
 * @example
 * ```ts
 * import type { Error } from "rest-api-client"
 * import { Schema } from "effect"
 *
 * const ErrorSchema = Schema.Struct({ message: Schema.String })
 * type ErrorType = Error.InferResponseError<typeof ErrorSchema>
 * // ErrorType = { message: string }
 * ```
 */
export type InferResponseError<T extends MakerError> = T extends MakerSchema
	? S.Schema.Type<T>
	: T extends MakerErrorFn
	? InferEffectError<T>
	: never
