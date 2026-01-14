/**
 * SimpleStateLibrary - Unit Tests
 * Run with: node test.js (requires Node.js environment)
 * Or open test.html in a browser
 */

// Test utilities
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
    tests.push({ description, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            `Expected ${expected}, got ${actual}. ${message || ""}`
        );
    }
}

function runTests() {
    console.log("🧪 Running SimpleStateLibrary Tests\n");

    tests.forEach(({ description, fn }) => {
        try {
            fn();
            console.log(`✓ ${description}`);
            passedTests++;
        } catch (error) {
            console.error(`✗ ${description}`);
            console.error(`  ${error.message}\n`);
            failedTests++;
        }
    });

    console.log(`\n📊 Results: ${passedTests} passed, ${failedTests} failed`);
    return failedTests === 0;
}

// ============= TESTS =============

test("Model can be instantiated", () => {
    class TestModel extends Model {
        name = "";
    }
    const model = new TestModel("test");
    assert(model !== null, "Model should be created");
});

test("Model properties can be set", () => {
    class TestModel extends Model {
        name = "";
    }
    const model = new TestModel("test");
    model.name = "John";
    assertEquals(model.name, "John", "Property should be set");
});

test("Model properties trigger persistence", () => {
    class TestModel extends Model {
        name = "";
    }
    const model = new TestModel("test");
    model.name = "John";
    const stored = sessionStorage.getItem("model:test");
    assert(stored !== null, "Should save to sessionStorage");
    const data = JSON.parse(stored);
    assertEquals(data.name, "John", "Stored data should contain property");
});

test("Model restores from sessionStorage", () => {
    // Clear and set up
    sessionStorage.clear();
    sessionStorage.setItem(
        "model:restore-test",
        JSON.stringify({ name: "Alice", email: "alice@example.com" })
    );

    class TestModel extends Model {
        name = "";
        email = "";
    }

    const model = new TestModel("restore-test");
    assertEquals(model.name, "Alice", "Should restore name from storage");
    assertEquals(model.email, "alice@example.com", "Should restore email from storage");

    sessionStorage.clear();
});

test("Methods are not persisted", () => {
    class TestModel extends Model {
        name = "";
        getName() {
            return this.name;
        }
    }

    const model = new TestModel("method-test");
    model.name = "Bob";

    const stored = JSON.parse(sessionStorage.getItem("model:method-test"));
    assert(!stored.hasOwnProperty("getName"), "Methods should not be persisted");

    sessionStorage.clear();
});

test("Private properties (__ prefix) are not persisted", () => {
    class TestModel extends Model {
        name = "";
        __secret = "hidden";
    }

    const model = new TestModel("private-test");
    model.name = "Charlie";

    const stored = JSON.parse(sessionStorage.getItem("model:private-test"));
    assert(!stored.hasOwnProperty("__secret"), "Private properties should not be persisted");
    assertEquals(stored.name, "Charlie", "Public properties should still be persisted");

    sessionStorage.clear();
});

test("Multiple model instances are independent", () => {
    class User extends Model {
        name = "";
    }

    const user1 = new User("user1");
    const user2 = new User("user2");

    user1.name = "Alice";
    user2.name = "Bob";

    assertEquals(user1.name, "Alice", "user1 should have its own name");
    assertEquals(user2.name, "Bob", "user2 should have its own name");

    sessionStorage.clear();
});

test("Methods can access model properties", () => {
    class User extends Model {
        firstName = "John";
        lastName = "Doe";

        fullName() {
            return `${this.firstName} ${this.lastName}`;
        }
    }

    const user = new User("user");
    const full = user.fullName();
    assertEquals(full, "John Doe", "Method should access properties");

    sessionStorage.clear();
});

test("Endpoint property is not persisted", () => {
    class User extends Model {
        name = "";
        endpoint = "/api/user";
    }

    const user = new User("endpoint-test");
    user.name = "Eve";

    const stored = JSON.parse(sessionStorage.getItem("model:endpoint-test"));
    assert(!stored.hasOwnProperty("endpoint"), "Endpoint should not be persisted");

    sessionStorage.clear();
});

test("Same property value doesn't trigger re-persistence", () => {
    class TestModel extends Model {
        name = "initial";
    }

    const model = new TestModel("same-value-test");
    const stored1 = sessionStorage.getItem("model:same-value-test");

    // Set to same value
    model.name = "initial";
    const stored2 = sessionStorage.getItem("model:same-value-test");

    // Both should be same (not re-persisted)
    assertEquals(stored1, stored2, "Same values should not re-persist");

    sessionStorage.clear();
});

test("Changing property updates stored value", () => {
    class TestModel extends Model {
        count = 0;
    }

    const model = new TestModel("increment-test");
    model.count = 5;

    let stored = JSON.parse(sessionStorage.getItem("model:increment-test"));
    assertEquals(stored.count, 5, "Initial storage should have count=5");

    model.count = 10;
    stored = JSON.parse(sessionStorage.getItem("model:increment-test"));
    assertEquals(stored.count, 10, "Updated storage should have count=10");

    sessionStorage.clear();
});

test("Model can serialize complex data types", () => {
    class TestModel extends Model {
        items = ["a", "b", "c"];
        metadata = { version: 1, active: true };
    }

    const model = new TestModel("complex-test");

    const stored = JSON.parse(sessionStorage.getItem("model:complex-test"));
    assertEquals(
        JSON.stringify(stored.items),
        '["a","b","c"]',
        "Should persist arrays"
    );
    assertEquals(
        stored.metadata.version,
        1,
        "Should persist nested objects"
    );

    sessionStorage.clear();
});

test("Null values are persisted", () => {
    class TestModel extends Model {
        id = null;
        name = "test";
    }

    const model = new TestModel("null-test");

    const stored = JSON.parse(sessionStorage.getItem("model:null-test"));
    assertEquals(stored.id, null, "Null values should be persisted");
    assertEquals(stored.name, "test", "Other properties should still exist");

    sessionStorage.clear();
});

// Run tests if this file is executed
if (typeof module !== "undefined" && module.exports) {
    // Node.js environment
    module.exports = { runTests };
} else {
    // Browser environment
    window.addEventListener("load", () => {
        runTests();
    });
}
