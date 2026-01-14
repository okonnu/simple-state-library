/**
 * SimpleStateLibrary - A reactive, persistent state management library
 * Build web UIs using plain JavaScript classes as models
 */

// Global registry of model instances
const modelRegistry = new Map();

class Model {
    /**
     * Create a new Model instance
     * @param {string} instanceName - The name to register this model instance with (for DOM binding)
     */
    constructor(instanceName) {
        // Store metadata
        Object.defineProperty(this, "__instanceName", {
            value: instanceName,
            enumerable: false,
            writable: false,
        });

        Object.defineProperty(this, "__handlers", {
            value: new Map(),
            enumerable: false,
            writable: false,
        });

        // Restore from sessionStorage (always required)
        this.__restore();

        // Create the Proxy for reactivity
        const proxy = this.__createProxy();

        // Register the PROXY in the registry, not the raw object
        modelRegistry.set(instanceName, proxy);
        console.log(`[Model] Registered model "${instanceName}"`);
        console.log(`[Model] modelRegistry now has ${modelRegistry.size} models`);

        // Sync initial state to DOM bindings
        console.log(`[Model] Syncing initial state to DOM for "${instanceName}"`);
        proxy.__updateDOM();

        // Return the Proxy
        return proxy;
    }

    /**
     * Create a Proxy that intercepts property assignments
     * @private
     */
    __createProxy() {
        return new Proxy(this, {
            set: (target, property, value) => {
                // Ignore internal properties and methods
                if (
                    property.startsWith("__") ||
                    typeof value === "function" ||
                    property === "endpoint"
                ) {
                    target[property] = value;
                    return true;
                }

                // Only trigger updates if value actually changed
                if (target[property] === value) {
                    console.log(`[Model:${this.__instanceName}] No change for ${property}, skipping update`);
                    return true;
                }

                // Set the value
                console.log(`[Model:${this.__instanceName}] Setting ${property} = ${value}`);
                target[property] = value;

                // Persist to sessionStorage
                this.__persist();

                // Update DOM bindings
                console.log(`[Model:${this.__instanceName}] Updating DOM bindings...`);
                this.__updateDOM();

                return true;
            },

            get: (target, property) => {
                // Return the property value normally
                return target[property];
            },
        });
    }

    /**
     * Persist model state to sessionStorage
     * @private
     */
    __persist() {
        const data = {};
        for (const key in this) {
            // Skip internal properties, methods, and endpoint
            if (
                !key.startsWith("__") &&
                typeof this[key] !== "function" &&
                key !== "endpoint"
            ) {
                data[key] = this[key];
            }
        }

        const storageKey = `model:${this.__instanceName}`;
        sessionStorage.setItem(storageKey, JSON.stringify(data));
    }

    /**
     * Restore model state from sessionStorage
     * @private
     */
    __restore() {
        const storageKey = `model:${this.__instanceName}`;
        const stored = sessionStorage.getItem(storageKey);

        if (stored) {
            try {
                const data = JSON.parse(stored);
                for (const key in data) {
                    this[key] = data[key];
                }
            } catch (e) {
                console.error(
                    `Failed to restore model ${this.__instanceName} from storage`,
                    e
                );
            }
        }
    }

    /**
     * Update all DOM elements bound to this model
     * @private
     */
    __updateDOM() {
        const selector = `[data-bind^="${this.__instanceName}."], [data-model^="${this.__instanceName}."]`;
        console.log(`[Model:${this.__instanceName}] Looking for elements with selector: ${selector}`);

        const elements = document.querySelectorAll(selector);
        console.log(`[Model:${this.__instanceName}] Found ${elements.length} elements to update`);

        elements.forEach((element) => {
            const binding = element.getAttribute("data-bind") ||
                element.getAttribute("data-model") || "";

            // Extract just the property part (remove model name prefix)
            const [modelName, ...propertyParts] = binding.split(".");
            const propertyBinding = propertyParts.join(".");

            console.log(`[Model:${this.__instanceName}] Updating element with binding: ${binding} (property: ${propertyBinding})`);
            this.__updateElement(element, propertyBinding);
        });
    }

    /**
     * Update a single DOM element with the current model value
     * @private
     */
    __updateElement(element, binding) {
        const value = this.__getPropertyValue(binding);
        console.log(`[Model:${this.__instanceName}] __getPropertyValue("${binding}") returned: "${value}"`);

        if (element.type === "checkbox") {
            console.log(`[Model:${this.__instanceName}] Setting checkbox.checked = ${!!value}`);
            element.checked = !!value;
        } else if (element.tagName === "INPUT" || element.tagName === "SELECT") {
            console.log(`[Model:${this.__instanceName}] Setting element.value = "${value}"`);
            element.value = value;
        } else if (element.tagName === "TEXTAREA") {
            console.log(`[Model:${this.__instanceName}] Setting element.textContent = "${value}"`);
            element.textContent = value;
        } else {
            console.log(`[Model:${this.__instanceName}] Setting ${element.tagName}.textContent = "${value}"`);
            element.textContent = value;
        }
    }

    /**
     * Get a property value from the model (supports methods and nested properties)
     * @param {string} propertyPath - Just the property path, e.g., "name" or "fullName" (without model name)
     * @private
     */
    __getPropertyValue(propertyPath) {
        const parts = propertyPath.split(".");
        let value = this;

        for (const part of parts) {
            if (value == null) return "";

            // Check if it's a method call (no parentheses in binding, but we call it)
            if (typeof value[part] === "function") {
                value = value[part]();
            } else {
                value = value[part];
            }
        }

        return value ?? "";
    }

    /**
     * Fetch model data from the API endpoint and populate the model
     * @returns {Promise<void>}
     */
    async get() {
        if (!this.endpoint) {
            console.warn(
                `Model ${this.__instanceName} has no endpoint defined for get()`
            );
            return;
        }

        try {
            const response = await fetch(this.endpoint, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Populate model with response data
            for (const key in data) {
                if (!key.startsWith("__") && this.hasOwnProperty(key)) {
                    this[key] = data[key];
                }
            }
        } catch (error) {
            console.error(`Failed to fetch model ${this.__instanceName}`, error);
            throw error;
        }
    }

    /**
     * POST the current model state to the API endpoint
     * @returns {Promise<void>}
     */
    async post() {
        if (!this.endpoint) {
            console.warn(
                `Model ${this.__instanceName} has no endpoint defined for post()`
            );
            return;
        }

        try {
            // Serialize only public properties (exclude __ prefixed and methods)
            const payload = {};
            for (const key in this) {
                if (
                    !key.startsWith("__") &&
                    typeof this[key] !== "function" &&
                    key !== "endpoint"
                ) {
                    payload[key] = this[key];
                }
            }

            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // If server returns data, update the model
            const data = await response.json();
            if (data && typeof data === "object") {
                for (const key in data) {
                    if (!key.startsWith("__") && this.hasOwnProperty(key)) {
                        this[key] = data[key];
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to post model ${this.__instanceName}`, error);
            throw error;
        }
    }
}

// Track which elements are already bound to prevent duplicate listeners
const boundElements = new WeakSet();

/**
 * Initialize all DOM bindings when the library loads
 * Scans the DOM for data-bind and data-model attributes and wires them up
 */
function initializeDOMBindings() {
    console.log("[initializeDOMBindings] Starting initialization...");
    console.log(`[initializeDOMBindings] modelRegistry has ${modelRegistry.size} models:`, Array.from(modelRegistry.keys()));

    // Setup two-way bindings (data-model)
    const twoWayElements = document.querySelectorAll("[data-model]");
    console.log(`[initializeDOMBindings] Found ${twoWayElements.length} two-way binding elements`);

    twoWayElements.forEach((element) => {
        // Skip if already bound
        if (boundElements.has(element)) {
            console.log(`[initializeDOMBindings] Element already bound, skipping`);
            return;
        }

        const binding = element.getAttribute("data-model");
        const [modelName, ...propertyParts] = binding.split(".");
        console.log(`[initializeDOMBindings] Setting up two-way binding for ${binding} on ${element.tagName}`);

        boundElements.add(element);

        // Add input listener to update model when user changes the input
        const inputHandler = (e) => {
            console.log(`[Binding Event] Input on ${binding}`);
            const model = modelRegistry.get(modelName);
            if (model) {
                const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
                console.log(`[Binding Event] Model.${propertyParts[0]} = ${value} (from ${e.type})`);
                model[propertyParts[0]] = value;
            } else {
                console.warn(`[Binding Event] Model "${modelName}" not found!`);
            }
        };

        element.addEventListener("input", inputHandler);

        // Add change listener for completeness (especially for checkboxes and selects)
        const changeHandler = (e) => {
            console.log(`[Binding Event] Change on ${binding}`);
            const model = modelRegistry.get(modelName);
            if (model) {
                const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
                console.log(`[Binding Event] Model.${propertyParts[0]} = ${value} (from ${e.type})`);
                model[propertyParts[0]] = value;
            } else {
                console.warn(`[Binding Event] Model "${modelName}" not found!`);
            }
        };

        element.addEventListener("change", changeHandler);
    });

    // Setup one-way bindings (data-bind)
    // These are read-only and will update when the model changes
    // The model's __updateDOM method handles these updates
    const oneWayElements = document.querySelectorAll("[data-bind]");
    console.log(`[initializeDOMBindings] Found ${oneWayElements.length} one-way binding elements`);
}

// Make Model and modelRegistry available globally for non-module scripts
if (typeof window !== "undefined") {
    window.Model = Model;
    window.modelRegistry = modelRegistry;
}

// Initialize bindings when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDOMBindings);
} else {
    // DOM is already loaded (happens with defer or module scripts)
    initializeDOMBindings();
}

// Re-initialize bindings periodically for 2 seconds to catch dynamically added models
// This ensures models created via ES6 modules get their bindings set up
let initAttempt = 0;
const maxAttempts = 20; // 20 attempts * 100ms = 2 seconds
const initInterval = setInterval(() => {
    initAttempt++;
    console.log(`[initializeDOMBindings] Retry ${initAttempt}/${maxAttempts} - modelRegistry has ${modelRegistry.size} models`);
    initializeDOMBindings();

    if (initAttempt >= maxAttempts) {
        clearInterval(initInterval);
    }
}, 100);

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = { Model, modelRegistry };
}
