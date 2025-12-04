import { Effect, Schema, Layer, Console } from "effect"
import { Client } from "../src"
import { ApiError, NewTodo, Todo } from "./common"
import { HttpClientResponse } from "@effect/platform"

// Service providing a client instance with custom error handling
class ApiClient extends Client.Service<ApiClient>()("@app/ApiClient", {
	error: (res: HttpClientResponse.HttpClientResponse) =>
		Effect.fail(
			new ApiError({
				method: res.request.method,
				endpoint: res.request.url,
				statusCode: res.status,
				statusText: String(res.status),
				message: `Request failed: ${res.status}`,
			})
		),
}) {}

// Service depending on ApiClient, exposing CRUD operations as accessor functions
export class TodoRepo extends Effect.Service<TodoRepo>()("@app/TodoRepo", {
	effect: Effect.gen(function* () {
		// Yield client dependency from the service context
		const client = yield* ApiClient.client

		// Build route functions using the injected client
		const getTodos = client.get({ url: "/todos", response: Todo.pipe(Schema.Array) })

		const getTodo = client.get({ url: (params: { id: string }) => `/todos/${params.id}`, response: Todo })

		const createTodo = client.post({ url: "/todos", body: NewTodo, response: Todo })

		const updateTodo = client.put({
			url: (params: { id: string }) => `/todos/${params.id}`,
			body: Todo,
			response: Todo,
		})

		const deleteTodo = client.del({ url: (params: { id: string }) => `/todos/${params.id}` })

		return {
			getTodos,
			getTodo,
			createTodo,
			updateTodo,
			deleteTodo,
		}
	}),
	dependencies: [ApiClient.Default], // Provide the ApiClient service dependency
	accessors: true, // Generate static accessor functions (e.g., TodoRepo.getTodo)
}) {}

// Use accessor functions in Effect.gen, providing merged layers
const example = Effect.gen(function* () {
	const todo = yield* TodoRepo.getTodo({ url: { id: "123" } })
	yield* Console.log("Todo:", todo)
}).pipe(
	Effect.provide(
		// Merge repository layer with client config layer
		Layer.merge(TodoRepo.Default, Client.layerConfig({ url: "https://example.com", accessToken: "token" }))
	),
	Effect.catchAll((error) => Console.error("Error:", error))
)

example.pipe(Effect.runPromise)
