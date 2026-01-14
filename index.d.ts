/**
 * TypeScript type definitions for SimpleStateLibrary
 * 
 * Usage:
 * - Place this file alongside index.js
 * - TypeScript will automatically pick up the types
 * - Or add to jsconfig.json: "typeRoots": ["./index.d.ts"]
 */

/**
 * Base model class for creating reactive, persistent state
 * 
 * @example
 * class User extends Model {
 *   id = null;
 *   name = "";
 *   email = "";
 *   endpoint = "/api/user";
 *   
 *   fullName() {
 *     return `${this.name}`;
 *   }
 * }
 * 
 * const user = new User("user");
 * user.name = "John"; // DOM updates automatically
 */
declare class Model {
    /**
     * Create a new Model instance
     * 
     * @param instanceName - The name to register this model with (for DOM bindings)
     *                       This is used as the identifier in data-bind and data-model attributes
     * @param sessionPersist - Whether to persist to sessionStorage (default: true)
     * 
     * @example
     * const user = new User("user");
     * // Now you can use: <input data-model="user.name">
     * 
     * // Disable persistence:
     * const tempUser = new User("tempUser", false);
     */
    constructor(instanceName: string, sessionPersist?: boolean);

    /**
     * Optional API endpoint for get() and post() methods
     * 
     * @example
     * class User extends Model {
     *   endpoint = "/api/user";
     * }
     */
    endpoint?: string;

    /**
     * Fetch model data from the API endpoint and populate the model
     * 
     * Makes a GET request to the endpoint property and updates the model
     * with the response data. Methods and private properties are ignored.
     * 
     * @returns Promise that resolves when the request completes
     * @throws Error if the request fails or no endpoint is defined
     * 
     * @example
     * const user = new User("user");
     * await user.get(); // GET /api/user and populate model
     */
    get(): Promise<void>;

    /**
     * Send the current model state to the API endpoint
     * 
     * Makes a POST request with the model data as JSON payload.
     * Only public properties are included (methods and __ prefixed properties are excluded).
     * The payload shape always matches the model exactly.
     * 
     * @returns Promise that resolves when the request completes
     * @throws Error if the request fails or no endpoint is defined
     * 
     * @example
     * const user = new User("user");
     * user.name = "Alice";
     * await user.post(); // POST /api/user with updated data
     */
    post(): Promise<void>;

    /**
     * Private internal method - do not use directly
     * Restores model state from sessionStorage
     */
    private __restore(): void;

    /**
     * Private internal method - do not use directly
     * Persists model state to sessionStorage
     */
    private __persist(): void;

    /**
     * Private internal method - do not use directly
     * Creates and returns a Proxy for reactivity
     */
    private __createProxy(): ProxyHandler<Model>;

    /**
     * Private internal method - do not use directly
     * Updates all DOM elements bound to this model
     */
    private __updateDOM(): void;
}

/**
 * DOM Binding Attributes
 * 
 * Use these attributes on HTML elements to bind them to model properties
 * 
 * @example
 * <!-- One-way binding (reads from model) -->
 * <span data-bind="user.name"></span>
 * <h1 data-bind="user.fullName"></h1>
 * 
 * <!-- Two-way binding (reads and writes to model) -->
 * <input data-model="user.name">
 * <select data-model="user.role">
 *   <option value="admin">Admin</option>
 * </select>
 */
interface ModelBindings {
    /**
     * One-way binding: Updates the DOM when the model property changes
     * 
     * Supports:
     * - Simple properties: data-bind="user.name"
     * - Method calls: data-bind="user.fullName"
     * 
     * The bound element's text content or value is updated automatically.
     */
    "data-bind": `${string}.${string}`;

    /**
     * Two-way binding: Synchronizes the input with the model property
     * 
     * Works with:
     * - <input> elements
     * - <select> elements
     * - <textarea> elements
     * 
     * Updates both the DOM and the model automatically.
     */
    "data-model": `${string}.${string}`;
}

/**
 * Example usage:
 * 
 * @example
 * // Define a model
 * class Todo extends Model {
 *   title = "";
 *   completed = false;
 *   priority = "normal";
 *   endpoint = "/api/todos/1";
 *   
 *   getPriority() {
 *     return this.priority.toUpperCase();
 *   }
 * }
 * 
 * // Create instance
 * const todo = new Todo("todo");
 * 
 * // Use in HTML
 * // <input data-model="todo.title">
 * // <select data-model="todo.priority">
 * // <span data-bind="todo.getPriority"></span>
 * 
 * // Update from code
 * todo.title = "Buy milk";
 * todo.completed = true;
 * 
 * // Sync with server
 * await todo.get();   // Load from /api/todos/1
 * await todo.post();  // Save to /api/todos/1
 */

declare global {
    /**
     * The Model class is available globally
     */
    var Model: typeof Model;
}

export { Model };
export type { ModelBindings };
