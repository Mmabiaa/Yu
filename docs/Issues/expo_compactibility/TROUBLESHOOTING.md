# Troubleshooting Guide

## Windows Path Issue: `node:sea` Directory Error

### Problem
When running `npm start`, you may encounter:
```
Error: ENOENT: no such file or directory, mkdir '...\.expo\metro\externals\node:sea'
```

This is a known issue with Expo SDK 50 on Windows where it tries to create a directory with `node:sea` (containing a colon), which is invalid in Windows file paths.

### Solutions

#### Solution 1: Use Metro Config (Recommended)
The `metro.config.js` file has been created with a workaround. Try:

```powershell
# Clear cache and restart
npx expo start --clear
```

#### Solution 2: Manual Directory Fix
If Solution 1 doesn't work, manually create the directory structure:

```powershell
# Run the fix script
.\fix-expo.ps1

# Or manually:
New-Item -ItemType Directory -Path ".expo\metro\externals" -Force
```

#### Solution 3: Use Expo Go App (Alternative)
Instead of using the development server, you can:

1. Install Expo Go on your phone
2. Run: `npx expo start`
3. Scan the QR code with Expo Go app

#### Solution 4: Downgrade Expo (If needed)
If the issue persists, you can try Expo SDK 49:

```powershell
npm install expo@~49.0.0
npx expo start --clear
```

#### Solution 5: Move Project Outside OneDrive
OneDrive paths can sometimes cause issues. Try moving the project to a local directory:

```powershell
# Move to C:\Users\<username>\Projects\Yu
# Then run npm install and npm start
```

### Additional Fixes

#### Clear All Caches
```powershell
# Clear npm cache
npm cache clean --force

# Clear Expo cache
npx expo start --clear

# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

#### Check Node.js Version
Ensure you're using Node.js 18+:
```powershell
node --version
```

If not, update Node.js from [nodejs.org](https://nodejs.org/)

### Still Having Issues?

1. Check Expo status: [status.expo.dev](https://status.expo.dev)
2. Try the Expo Discord: [discord.gg/expo](https://discord.gg/expo)
3. Check GitHub issues: [github.com/expo/expo/issues](https://github.com/expo/expo/issues)

