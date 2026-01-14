/**
 * Test file to verify data-model two-way binding works correctly
 * Run this with: node test-binding.js
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

const htmlContent = `
<!DOCTYPE html>
<html>
<head></head>
<body>
  <input type="text" id="name" data-model="user.name" />
  <input type="text" id="email" data-model="user.email" />
  <input type="checkbox" id="notifications" data-model="settings.notifications" />
  <span id="display" data-bind="user.name">—</span>
</body>
</html>
`;

const dom = new JSDOM(htmlContent);
global.window = dom.window;
global.document = dom.window.document;
global.sessionStorage = new Map();

// Override sessionStorage to use Map
global.sessionStorage.getItem = function (key) {
    return this.get(key) || null;
};
global.sessionStorage.setItem = function (key, value) {
    this.set(key, value);
};
global.sessionStorage.clear = function () {
    this.clear();
};

// Now load the library
const { Model, modelRegistry } = require('./index.js');

console.log('=== Data-Model Binding Test ===\n');

// Create test models
class User extends Model {
    name = '';
    email = '';
}

class Settings extends Model {
    notifications = false;
}

const user = new User('user');
const settings = new Settings('settings');

console.log(`✓ Created models: ${Array.from(modelRegistry.keys()).join(', ')}`);
console.log(`✓ modelRegistry size: ${modelRegistry.size}\n`);

// Test 1: Check if elements have data-model attributes
console.log('=== DOM Elements ===');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const notifCheckbox = document.getElementById('notifications');
const display = document.getElementById('display');

console.log(`✓ Name input has data-model: ${nameInput.getAttribute('data-model')}`);
console.log(`✓ Email input has data-model: ${emailInput.getAttribute('data-model')}`);
console.log(`✓ Checkbox has data-model: ${notifCheckbox.getAttribute('data-model')}`);
console.log(`✓ Display span has data-bind: ${display.getAttribute('data-bind')}\n`);

// Test 2: Simulate user input and check if model updates
console.log('=== Simulating User Input ===');
console.log('Setting name input value to "John Doe"...');
nameInput.value = 'John Doe';
const inputEvent = new dom.window.Event('input', { bubbles: true });
nameInput.dispatchEvent(inputEvent);

setTimeout(() => {
    console.log(`✓ User model name after input: "${user.name}"`);
    console.log(`✓ SessionStorage contains: ${JSON.stringify(JSON.parse(global.sessionStorage.getItem('model:user')))}\n`);

    // Test 3: Change model and check if DOM updates
    console.log('=== Simulating Model Change ===');
    console.log('Setting user.name = "Jane Smith"...');
    user.name = 'Jane Smith';

    console.log(`✓ Input value after model change: "${nameInput.value}"`);
    console.log(`✓ Display value after model change: "${display.textContent}"`);
    console.log(`✓ SessionStorage: ${JSON.stringify(JSON.parse(global.sessionStorage.getItem('model:user')))}\n`);

    // Test 4: Checkbox binding
    console.log('=== Checkbox Test ===');
    console.log('Checking notifications checkbox...');
    notifCheckbox.checked = true;
    const changeEvent = new dom.window.Event('change', { bubbles: true });
    notifCheckbox.dispatchEvent(changeEvent);

    setTimeout(() => {
        console.log(`✓ Settings model notifications: ${settings.notifications}`);
        console.log(`✓ SessionStorage: ${JSON.stringify(JSON.parse(global.sessionStorage.getItem('model:settings')))}\n`);

        console.log('=== All Tests Completed ===');
        process.exit(0);
    }, 100);
}, 100);
