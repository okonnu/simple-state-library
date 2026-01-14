/**
 * SimpleStateLibrary - A reactive, persistent state management library
 * Build web UIs using plain JavaScript classes as models
 */

class Model {
    /**
     * Create a new Model instance
     * @param {string} instanceName - The name to register this model instance with (for DOM binding)
     * @param {boolean} sessionPersist - Whether to persist to sessionStorage (default: true)
     */
    constructor(instanceName, sessionPersist = true) {
        // Store metadata
        Object.defineProperty(this, "__instanceName", {
            value: instanceName,
            enumerable: false,
            writable: false,
        });

        Object.defineProperty(this, "__sessionPersist", {
            value: sessionPersist,
            enumerable: false,
            writable: false,
        });

        Object.defineProperty(this, "__handlers", {
            value: new Map(),
            enumerable: false,
            writable: false,
        });

        // Restore from sessionStorage if available and persistence is enabled
        if (this.__sessionPersist) {
            this.__restore();
        }

        // Create and return a Proxy for reactivity
        return this.__createProxy();
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
                    return true;
                }

                // Set the value
                target[property] = value;

                // Persist to sessionStorage
                this.__persist();

                // Update DOM bindings
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
        // Skip persistence if disabled
        if (!this.__sessionPersist) {
            return;
        }

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
        // Update one-way bindings (data-bind)
        document
            .querySelectorAll(
                `[data-bind^="${this.__instanceName}."], [data-model^="${this.__instanceName}."]`
            )
            .forEach((element) => {
                const binding = element.getAttribute("data-bind") ||
                    element.getAttribute("data-model") || "";
                this.__updateElement(element, binding);
            });
    }

    /**
     * Update a single DOM element with the current model value
     * @private
     */
    __updateElement(element, binding) {
        const value = this.__getPropertyValue(binding);

        if (element.tagName === "INPUT" || element.tagName === "SELECT") {
            element.value = value;
        } else if (element.tagName === "TEXTAREA") {
            element.textContent = value;
        } else {
            element.textContent = value;
        }
    }

    /**
     * Get a property value from the model (supports methods and nested properties)
     * @private
     */
    __getPropertyValue(binding) {
        const [modelName, ...parts] = binding.split(".");
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

/**
 * Initialize all DOM bindings when the library loads
 * Scans the DOM for data-bind and data-model attributes and wires them up
 */
function initializeDOMBindings() {
    document.addEventListener("DOMContentLoaded", () => {
        // Setup two-way bindings (data-model)
        document.querySelectorAll("[data-model]").forEach((element) => {
            const binding = element.getAttribute("data-model");
            const [modelName, ...propertyParts] = binding.split(".");
            const propertyPath = propertyParts.join(".");

            // Add input listener to update model when user changes the input
            element.addEventListener("input", (e) => {
                if (window[modelName]) {
                    window[modelName][propertyParts[0]] = e.target.value;
                }
            });

            element.addEventListener("change", (e) => {
                if (window[modelName]) {
                    window[modelName][propertyParts[0]] = e.target.value;
                }
            });
        });

        // Setup one-way bindings (data-bind)
        // These are read-only and will update when the model changes
        // The model's __updateDOM method handles these updates
    });
}

// Initialize bindings when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDOMBindings);
} else {
    initializeDOMBindings();
}

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = { Model };
}
