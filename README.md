# SimpleStateLibrary

A reactive, persistent state management library that lets you build web UIs using plain JavaScript classes as models.

**Write normal JS objects. Mutate them normally. The DOM, persistence, and API syncing update automatically.**

## Features

- ✨ **Proxy-based reactivity** - Automatic DOM updates on property changes
- 💾 **Automatic persistence** - SessionStorage saves on every change
- 🔗 **Declarative DOM bindings** - Connect HTML with `data-bind` and `data-model` attributes
- 🌐 **API integration** - Optional REST endpoint support with `get()` and `post()`
- 🎯 **Zero setup** - No stores, signals, subscriptions, effects, or lifecycle hooks
- 📦 **Plain JavaScript** - Just extend the `Model` class

## Why This Library?

There are no state stores, signals, subscriptions, effects, or lifecycle hooks exposed to developers. Reactivity is completely invisible.

The library is designed for **small-to-medium applications**, **internal tools**, and situations where you want **maximum productivity with minimal ceremony**.

If you know JavaScript, you already know how to use this library.

## Installation

```bash
npm install simple-state-library
```

Or include directly in HTML:

```html
<script src="index.js"></script>
```

## Quick Start

### 1. Define a Model

```javascript
class User extends Model {
  id = null;
  name = "";
  email = "";
  role = "viewer";
  endpoint = "/api/user";

  fullName() {
    return `${this.name} (${this.email})`;
  }
}
```

### 2. Create an Instance

```javascript
const user = new User("user");
```

That's it. The model is now reactive, persistent, and available to the DOM.

### 3. Bind to HTML

```html
<h1 data-bind="user.fullName"></h1>

<input data-model="user.name" placeholder="Name" />
<input data-model="user.email" placeholder="Email" />

<select data-model="user.role">
  <option value="admin">Admin</option>
  <option value="viewer">Viewer</option>
</select>
```

- `data-bind` - One-way binding (read-only, updates when model changes)
- `data-model` - Two-way binding (updates model when user changes input)

### 4. Use the Model

```javascript
user.name = "John"; // DOM updates automatically
user.role = "admin"; // <select> updates automatically
```

State is also saved to sessionStorage automatically.

### 5. Load and Save (Optional)

```javascript
await user.get(); // fetches from /api/user and populates the model
await user.post(); // sends current model state to the backend
```

No mapping, no DTOs — the model is the payload.

## How It Works

### Proxy-Based Reactivity

Each model instance is wrapped in an ES6 Proxy. Any property assignment is intercepted and triggers:

1. DOM updates
2. Persistence to sessionStorage

```javascript
user.name = "Alice"; // Proxy intercepts this

// Automatically triggers:
// - sessionStorage update
// - DOM binding updates
// - Element value updates
```

### Declarative DOM Bindings

The library scans the DOM for binding attributes:

- **`data-bind="model.property"`** - One-way binding

  - Updates the DOM when the model changes
  - Supports method calls: `data-bind="user.fullName"`
  - Read-only from the model's perspective

- **`data-model="model.property"`** - Two-way binding
  - Automatically syncs form inputs with model properties
  - Works with `<input>`, `<select>`, and `<textarea>`
  - Updates model when user changes the input

### Automatic Persistence

Model data is automatically saved to sessionStorage on every change (unless disabled):

```javascript
// Default: persistence enabled
const user = new User("user");
user.name = "Bob";

// It automatically saves:
sessionStorage.setItem(
  "model:user",
  JSON.stringify({
    id: null,
    name: "Bob",
    email: "bob@example.com",
    role: "viewer",
  })
);

// On page load, the model is restored from storage
```

**Optional: Disable Persistence**

```javascript
// Create a model without sessionStorage persistence
const temp = new User("temp", false);
temp.name = "Temporary"; // NOT saved to sessionStorage
```

This is useful for temporary models that don't need persistence.

**What gets saved:**

- Public properties (don't start with `__`)
- Excludes methods
- Excludes the `endpoint` property

### API Integration

Models can optionally define an endpoint and use REST methods:

```javascript
class User extends Model {
  name = "";
  email = "";
  endpoint = "/api/user";
}

const user = new User("user");

// Load from server
await user.get(); // GET /api/user

// Save to server
user.name = "Updated";
await user.post(); // POST /api/user with { name: "Updated", ... }
```

The payload always matches the model exactly. No DTOs, no mapping.

## API Reference

### Model Class

#### Constructor

```javascript
const user = new User("instanceName");
const temp = new User("tempUser", false); // Disable persistence
```

**Parameters:**

- `instanceName` (string) - The name used for DOM bindings and sessionStorage keys
- `sessionPersist` (boolean, optional, default: `true`) - Whether to persist to sessionStorage. Set to `false` for temporary models that shouldn't save data

**Examples:**

```javascript
// With persistence (default)
const user = new User("user");
user.name = "Alice"; // Saved to sessionStorage

// Without persistence
const temp = new User("temp", false);
temp.name = "Bob"; // NOT saved to sessionStorage
```

#### Properties

```javascript
class User extends Model {
  // Public properties (automatically persisted)
  name = "";
  email = "";

  // Optional API endpoint
  endpoint = "/api/user";

  // Private properties (not persisted)
  __internalState = null;

  // Methods are automatically excluded
  getDisplayName() {
    return this.name;
  }
}
```

#### Methods

##### `async get()`

Fetches data from the API endpoint and populates the model.

```javascript
await user.get(); // GET to endpoint, populate model

// Error handling
try {
  await user.get();
} catch (error) {
  console.error("Failed to load user", error);
}
```

##### `async post()`

Sends the current model state to the API endpoint.

```javascript
user.name = "Alice";
await user.post(); // POST to endpoint with model data

// Error handling
try {
  await user.post();
} catch (error) {
  console.error("Failed to save user", error);
}
```

## HTML Bindings

### One-Way Binding (data-bind)

```html
<!-- Text content -->
<h1 data-bind="user.name"></h1>

<!-- Method calls -->
<p data-bind="user.fullName"></p>

<!-- Works with any element -->
<span data-bind="settings.theme"></span>
```

The element's text content updates whenever the property changes.

### Two-Way Binding (data-model)

```html
<!-- Input -->
<input data-model="user.name" />

<!-- Email input -->
<input type="email" data-model="user.email" />

<!-- Select -->
<select data-model="user.role">
  <option value="admin">Admin</option>
  <option value="viewer">Viewer</option>
</select>

<!-- Textarea -->
<textarea data-model="user.bio"></textarea>

<!-- For checkboxes, use JavaScript -->
<input type="checkbox" onchange="model.field = this.checked" />
```

Two-way bindings automatically:

- Update the DOM when the model changes
- Update the model when the user changes the input

## SessionStorage

All public model properties are automatically saved to sessionStorage whenever they change.

```javascript
// After creating and modifying a user:
const user = new User("user");
user.name = "John";
user.email = "john@example.com";

// sessionStorage now contains:
// localStorage["model:user"] = '{"name":"John","email":"john@example.com",...}'
```

**Automatic on page load:**

```javascript
// User data is restored if it exists in sessionStorage
const user = new User("user");
// user.name is now "John" (if it was previously saved)
```

**Storage keys:** `model:{instanceName}`

**Persisted data:**

- All public properties
- Excludes methods
- Excludes private properties (starting with `__`)
- Excludes the `endpoint` property

## Examples

### Basic Counter

```javascript
class Counter extends Model {
  count = 0;

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}

const counter = new Counter("counter");
```

```html
<div>
  <button onclick="counter.increment()">+</button>
  <span data-bind="counter.count">0</span>
  <button onclick="counter.decrement()">-</button>
</div>
```

### Todo List

```javascript
class Todo extends Model {
  title = "";
  completed = false;
  endpoint = "/api/todos/1";
}

const todo = new Todo("todo");
```

```html
<input data-model="todo.title" />
<input
  type="checkbox"
  onchange="todo.completed = this.checked"
  data-bind="todo.completed"
/>
<span data-bind="todo.title"></span>

<button onclick="todo.post()">Save</button>
```

### Form with Validation

```javascript
class Contact extends Model {
  name = "";
  email = "";
  message = "";
  endpoint = "/api/contact";

  isValid() {
    return this.name && this.email && this.message;
  }

  async submit() {
    if (!this.isValid()) {
      alert("Please fill in all fields");
      return;
    }
    await this.post();
    // Reset
    this.name = "";
    this.email = "";
    this.message = "";
  }
}

const contact = new Contact("contact");
```

```html
<input data-model="contact.name" placeholder="Name" />
<input data-model="contact.email" placeholder="Email" />
<textarea data-model="contact.message" placeholder="Message"></textarea>

<button onclick="contact.submit()" disabled="disabled" id="submitBtn">
  Send
</button>

<script>
  // Enable button only when valid
  document.addEventListener("input", () => {
    document.getElementById("submitBtn").disabled = !contact.isValid();
  });
</script>
```

## Best Practices

### 1. Use Descriptive Instance Names

```javascript
// Good - instance name matches purpose
const userForm = new UserForm("userForm");
const settings = new Settings("settings");

// Instance name must be unique per model instance
// Changing it requires updating all bindings
```

### 2. Separate Models by Concern

```javascript
// Good - separate models for separate concerns
class User extends Model {
  name = "";
  email = "";
}

class Settings extends Model {
  theme = "light";
  notifications = true;
}

const user = new User("user");
const settings = new Settings("settings");
```

### 3. Use Methods for Computed Values

```javascript
class User extends Model {
  firstName = "";
  lastName = "";

  // Use methods for computed values
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Bind to the method
  // <span data-bind="user.fullName"></span>
}
```

### 4. Private Data with \_\_ Prefix

```javascript
class User extends Model {
  name = "";

  // This is never persisted or exposed
  __cache = {};

  // This is private - won't be in POST payload
  __internalId = null;
}
```

### 5. Handle API Errors

```javascript
async function loadUser() {
  try {
    await user.get();
  } catch (error) {
    console.error("Failed to load user:", error);
    // Show error to user
    document.getElementById("error").textContent = "Failed to load user";
  }
}
```

## Limitations

- **SessionStorage only** - Uses sessionStorage (not localStorage). Data clears when the tab closes.
- **Single instance per name** - Each instance name must be unique in your application
- **Synchronous DOM updates** - Updates happen synchronously; watch out with large datasets
- **No computed properties** - Use methods instead: `data-bind="model.methodName"`
- **No watchers** - No explicit watch/subscribe API; reactions are automatic

## Browser Support

- Modern browsers with:
  - ES6 Proxy support
  - sessionStorage API
  - Promise support

**Not supported in:**

- IE 11 and below
- Very old mobile browsers

## Performance Considerations

- **Small-to-medium models** - Designed for < 1MB of model data
- **DOM binding updates** - Updates trigger a full re-scan of DOM bindings; not optimized for hundreds of bindings
- **SessionStorage limits** - Most browsers: 5-10MB per origin

## File Size

- **Minified:** ~3KB
- **With gzip:** ~1.2KB

## Testing

See `example.html` for a complete working example with a test form.

```bash
# Open in browser
open example.html
```

## License

ISC

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Credits

Created by Okonu - Building tools for maximum productivity with minimal ceremony.
