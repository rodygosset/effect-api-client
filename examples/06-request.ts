import { FetchHttpClient } from "@effect/platform"
import { Console, Effect, Schema } from "effect"
import { Request } from "../src"
import { NewTodo, Todo } from "./common"

// Request batching: create request classes for Effect's batching and caching

// GET with static URL
class GetTodos extends Request.Get("app/GetTodos", {
	spec: { url: "/todos", response: Todo.pipe(Schema.Array) },
}) {}

// GET with dynamic URL and layer (removes HttpClient dependency)
class GetTodo extends Request.Get("app/GetTodo", {
	spec: { url: (params: { id: string }) => `/todos/${params.id}`, response: Todo },
	layer: FetchHttpClient.layer,
}) {}

// POST with body and response
class CreateTodo extends Request.Post("app/CreateTodo", {
	spec: {
		url: "/todos",
		body: NewTodo,
		response: Todo,
	},
}) {}

// PUT with dynamic URL and body
class UpdateTodo extends Request.Put("app/UpdateTodo", {
	spec: {
		url: (params: { id: string }) => `/todos/${params.id}`,
		body: Todo,
		response: Todo,
	},
}) {}

// DELETE with dynamic URL
class DeleteTodo extends Request.Del("app/DeleteTodo", {
	spec: {
		url: (params: { id: string }) => `/todos/${params.id}`,
	},
}) {}

const example = Effect.gen(function* () {
	const todos = yield* Effect.request(new GetTodos(), GetTodos.resolver)
	yield* Console.log("Todos:", todos)

	const todo = yield* Effect.request(new GetTodo({ url: { id: "123" } }), GetTodo.resolver)
	yield* Console.log("Todo:", todo)

	const created = yield* Effect.request(
		new CreateTodo({ body: { title: "New Todo", description: "Description" } }),
		CreateTodo.resolver
	)
	yield* Console.log("Created:", created)

	const updated = yield* Effect.request(
		new UpdateTodo({
			url: { id: "123" },
			body: { id: "123", title: "Updated", description: "Updated", completed: true },
		}),
		UpdateTodo.resolver
	)
	yield* Console.log("Updated:", updated)

	yield* Effect.request(new DeleteTodo({ url: { id: "123" } }), DeleteTodo.resolver)
	yield* Console.log("Deleted")
})

example.pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.catchAll((error) => Console.error("Error:", error)),
	Effect.runPromise
)
