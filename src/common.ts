import { Schema as S } from "effect"

/**
 * Type alias for Effect Schema used throughout the library.
 * Used for request body validation, response parsing, and error handling.
 */
export type MakerSchema = S.Schema<any>
