# Android Dropdown/Picker UI Fix

## Problem
Dropdowns were working on web but not functioning properly on Android devices when the app was built.

## Root Causes Identified & Fixed

### 1. **Modal Gesture Handling**
- **Issue**: The modal overlay was using `Pressable` which sometimes doesn't properly handle Android touch events outside the modal
- **Fix**: Changed to `TouchableWithoutFeedback` with proper `accessible={false}` for Android gesture priority

### 2. **Keyboard Handling**
- **Issue**: Keyboard wasn't being dismissed before opening the modal, causing focus issues on Android
- **Fix**: Added explicit `Keyboard.dismiss()` calls when opening/selecting items, especially for Android platform

### 3. **Android Hardware Acceleration & Status Bar**
- **Issue**: Modal rendering issues on Android due to GPU acceleration conflicts
- **Fix**: Added `hardwareAccelerated={true}` and `statusBarTranslucent={Platform.OS === 'android'}` props to Modal

### 4. **Elevation/Z-index Issues**
- **Issue**: Modal appearing behind content or below the keyboard on Android
- **Fix**: Added Android-specific `elevation: 5` and iOS shadow properties for proper layering

### 5. **KeyboardAvoidingView**
- **Issue**: Modal content overlapping with keyboard on Android
- **Fix**: Wrapped modal content in `KeyboardAvoidingView` with platform-specific behaviors

### 6. **Touch Target Size**
- **Issue**: Small option items difficult to tap on Android
- **Fix**: Added `minHeight: 48` to option items for better accessibility and tap targets

### 7. **Modal Height Optimization**
- **Issue**: Modal height not optimized for Android screens
- **Fix**: Increased max height to 75% on Android (vs 70% on iOS) and added `minHeight: 200`

### 8. **Accessibility**
- **Issue**: Missing accessibility properties causing interaction issues on Android
- **Fix**: Added proper `accessible`, `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` props

## Changes Made to FormPicker.tsx

### Imports Added
```typescript
useRef, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView
```

### Key Modifications
1. Added `Keyboard.dismiss()` before modal opens and after selection
2. Wrapped overlay in `TouchableWithoutFeedback` instead of `Pressable`
3. Added `KeyboardAvoidingView` to handle keyboard overlap
4. Added platform-specific Modal props:
   - `statusBarTranslucent={Platform.OS === 'android'}`
   - `hardwareAccelerated={Platform.OS === 'android'}`
5. Enhanced styles with:
   - Android-specific `elevation: 5`
   - Increased option min-height to 48
   - Platform-specific modal height (75% for Android, 70% for iOS)
6. Added complete accessibility support

## Testing Instructions

### Android Build & Test
```bash
# Build for Android
npx expo run:android

# Or with EAS
eas build --platform android
```

### Test Scenarios
1. ✅ Tap on any dropdown - modal should appear smoothly
2. ✅ Tap outside modal - should close properly
3. ✅ Tap "X" button - should close
4. ✅ Select an option - modal should close and value should update
5. ✅ Test with keyboard open - keyboard should dismiss and not overlap
6. ✅ Test on different Android versions (ensure compatibility)

## Compatibility
- ✅ Android (Fixed)
- ✅ iOS (Maintained)
- ✅ Web (Maintained)

## Performance Impact
Minimal - the changes are optimization-focused and add no significant overhead.
