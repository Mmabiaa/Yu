# Quick Fix for Windows Expo Error

## The Problem
Expo is trying to create a directory with `node:sea` (contains a colon), which is invalid on Windows.

## Quick Solution

Run these commands in PowerShell:

```powershell
# 1. Create the directory structure manually
New-Item -ItemType Directory -Path ".expo\metro\externals" -Force

# 2. Start Expo with cache cleared
npx expo start --clear
```

## Alternative: Use the Fix Script

```powershell
# Run the automated fix script
npm run fix:expo
```

## If Still Not Working

Try this workaround - temporarily patch the Expo CLI:

```powershell
# Clear everything
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Reinstall and start
npm install
npx expo start --clear
```

## Best Solution: Use Expo Go App

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Run: `npm start`
3. Scan the QR code with Expo Go app
4. This bypasses the Windows path issue entirely

## Still Having Issues?

Check `TROUBLESHOOTING.md` for more detailed solutions.

