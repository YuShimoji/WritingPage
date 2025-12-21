const assert = require('assert');
const hello = require('../hello.js');

console.log('Running tests for hello.js');

// Test case 1: Basic functionality
assert.strictEqual(hello('World'), 'Hello, World!', 'Should return greeting with name');

// Test case 2: Empty string
assert.strictEqual(hello(''), 'Hello, !', 'Should handle empty string');

// Test case 3: Special characters
assert.strictEqual(hello('Alice & Bob'), 'Hello, Alice & Bob!', 'Should handle special characters');

console.log('All tests passed!');
