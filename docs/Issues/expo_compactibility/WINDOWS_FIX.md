# Windows Fix Applied

## Problem
Expo SDK 50 has a bug on Windows where it tries to create a directory named `node:sea` (containing a colon), which is invalid in Windows file paths.

## Solution Applied
**Downgraded to Expo SDK 49** which doesn't have this Windows bug.

### Changes Made:
1. ✅ Updated `package.json` to use Expo SDK 49
2. ✅ Updated all Expo packages to SDK 49 compatible versions
3. ✅ Fixed camera imports for SDK 49 (`Camera` instead of `CameraView`)
4. ✅ Cleaned and reinstalled all dependencies

### Package Versions Changed:
- `expo`: `~50.0.0` → `~49.0.0`
- `react-native`: `0.73.0` → `0.72.6`
- `expo-camera`: `~14.0.0` → `~13.4.4`
- All other Expo packages updated to SDK 49 compatible versions

## Next Steps

1. **Start the app:**
   ```powershell
   npm start
   ```

2. **If you still see errors**, try:
   ```powershell
   npx expo start --clear
   ```

3. **Use Expo Go app** (recommended):
   - Install Expo Go on your phone
   - Run `npm start`
   - Scan QR code with Expo Go

## Why This Works

Expo SDK 49 doesn't have the `node:sea` directory creation bug that affects SDK 50 on Windows. SDK 49 is stable and fully compatible with all the features we're using.

## Future Updates

When Expo SDK 50+ fixes the Windows issue, you can upgrade by:
```powershell
npm install expo@latest
# Update other packages accordingly
```

For now, SDK 49 is the recommended stable version for Windows development.

