// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Windows path issues with node:sea
// This is a workaround for Expo SDK 50 on Windows
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

// Ensure cache directory exists (Windows workaround)
const cacheDir = path.join(__dirname, '.expo', 'metro', 'externals');
if (!fs.existsSync(cacheDir)) {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch (error) {
    // Ignore errors if directory already exists
  }
}

module.exports = config;

