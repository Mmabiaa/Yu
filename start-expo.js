#!/usr/bin/env node

// Load polyfills first
require('./node-polyfill.js');

// Get command line arguments
const args = process.argv.slice(2);

// Spawn expo with the provided arguments
const { spawn } = require('child_process');
const expo = spawn('npx', ['expo', ...args], {
  stdio: 'inherit',
  shell: true
});

expo.on('close', (code) => {
  process.exit(code);
});