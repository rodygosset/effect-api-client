import { Config, Console, Effect, Layer, Schema } from "effect"
import { Client, Service } from "../src"
import { Todo } from "./common"

// Layer setup: providing configuration and HTTP client to Effect runtime

class AuthError extends Schema.TaggedClass<AuthError>("@app/errors/AuthError")("AuthError", {
	message: Schema.String,
}) {}

// Create API client config layer
const ApiClientConfigLive = Layer.effect(
	Service.Config,
	Effect.gen(function* () {
		const url = yield* Config.string("API_URL")
		// wrap auth library like auth.js in an Effect.tryPromise
		const accessToken = yield* Effect.tryPromise({
			try: async () => "ey...." as const,
			catch: (error) => new AuthError({ message: String(error) }),
		})
		return { url, accessToken }
	})
)

// Compose layers: HTTP client + config
const layer = Service.layer.pipe(Layer.provide(ApiClientConfigLive))

// Define routes
const getTodo = Client.get({
	url: (params: { id: string }) => `/todos/${params.id}`,
	response: Todo,
})

// Use routes with layer
const example = Effect.gen(function* () {
	const todo = yield* getTodo({ url: { id: "123" } })
	yield* Console.log("Todo:", todo)
	return todo
})

// Run with layer
example.pipe(
	Effect.provide(layer),
	Effect.catchAll((error) => Console.error("Error:", error)),
	Effect.runPromise
)
