import { Data } from "effect"

/**
 * Represents a static URL value.
 */
export class Value extends Data.TaggedClass("@RestApiClient/Url/Value")<{
	url: string
}> {}

/**
 * Type alias for static URL string values.
 */
export type MakerUrlValue = string

/**
 * Creates a static URL value.
 *
 * @param url - Static URL string
 * @returns A Value instance with the URL
 *
 * @example
 * ```ts
 * import { Url } from "rest-api-client"
 *
 * const url = Url.value("/todos")
 * ```
 */
export const value = (url: MakerUrlValue) => new Value({ url })

/**
 * Represents a dynamic URL function.
 */
export class Fn<T extends MakerUrlFn = MakerUrlFn> extends Data.TaggedClass("@RestApiClient/Url/Fn")<{
	fn: T
}> {}

/**
 * Function type for dynamic URL generation.
 * Takes URL parameters and returns a URL string.
 */
export type MakerUrlFn = (arg: any) => string

/**
 * Creates the internal representation of a dynamic URL function.
 *
 * @template T - URL generation function type
 * @param fn - Function that takes URL parameters and returns a URL string
 * @returns Internal representation of a dynamic URL function
 *
 * @example
 * ```ts
 * import { Url } from "rest-api-client"
 *
 * const url = Url.fn((params: { id: string }) => `/todos/${params.id}`)
 * ```
 */
export const fn = <T extends MakerUrlFn>(fn: T) => new Fn({ fn })

/**
 * Internal URL representation union type.
 */
export type Url = Value | Fn

/**
 * Union type for URL makers: static string or dynamic function.
 *
 * @example
 * ```ts
 * import type { Url } from "rest-api-client"
 *
 * type Url1 = Url.MakerUrl<"/todos">
 * type Url2 = Url.MakerUrl<(params: { id: string }) => string>
 * ```
 */
export type MakerUrl = MakerUrlValue | MakerUrlFn

/**
 * Converts a MakerUrl to its internal representation.
 *
 * @template U - URL maker type
 */
export type ToUrl<U extends MakerUrl> = U extends MakerUrlValue ? Value : U extends MakerUrlFn ? Fn<U> : never

/**
 * Converts a MakerUrl to its internal Route representation.
 *
 * @template U - URL maker type
 * @param url - URL maker (string or function)
 * @returns Internal URL representation
 *
 * @example
 * ```ts
 * import { Url } from "rest-api-client"
 *
 * const urlMaker = Url.fromMakerUrl("/todos")
 * const dynamicUrl = Url.fromMakerUrl((params: { id: string }) => `/todos/${params.id}`)
 * ```
 */
export const fromMakerUrl = <U extends MakerUrl>(url: U) => (typeof url === "string" ? value(url) : fn(url))
