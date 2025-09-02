# Mac Setup Guide for CoinDesi React Native Project

## Prerequisites

### 1. Install Xcode
- Download and install Xcode from the Mac App Store
- Install Command Line Tools: `xcode-select --install`
- Accept Xcode license: `sudo xcodebuild -license accept`

### 2. Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Install Required Tools
```bash
# Install Node.js (if not already installed)
brew install node

# Install Watchman (required for React Native)
brew install watchman

# Install CocoaPods
sudo gem install cocoapods
# If you get permission errors:
sudo gem install cocoapods -n /usr/local/bin
```

## Setup Steps

### 1. Clone and Setup Project
```bash
cd CoinDesi
npm install
```

### 2. iOS Setup
```bash
cd ios
pod install
cd ..
```

### 3. Run the Project
```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios
# or
npx react-native run-ios
```

## Common Issues and Solutions

### Issue 1: Pod Install Fails
```bash
cd ios
rm -rf Pods
rm -rf Podfile.lock
pod install --repo-update
```

### Issue 2: Build Errors
```bash
# Clean build artifacts
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ..
npm run ios
```

### Issue 3: Simulator Issues
- Open Xcode → Window → Devices and Simulators
- Create a new simulator if needed
- Reset simulator: Device → Erase All Content and Settings

### Issue 4: Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

### Issue 5: Permission Issues
```bash
# Fix CocoaPods permissions
sudo gem uninstall cocoapods
sudo gem install cocoapods -n /usr/local/bin
```

## Troubleshooting Commands

### Clean Everything
```bash
# Run the cleanup script
chmod +x cleanup-mac.sh
./cleanup-mac.sh
```

### Manual Cleanup
```bash
# Remove all build artifacts
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf android/build
rm -rf android/app/build

# Reinstall
npm install
cd ios && pod install && cd ..
```

### Check Environment
```bash
# Check Node.js version
node --version

# Check React Native CLI
npx react-native --version

# Check CocoaPods
pod --version

# Check Xcode
xcodebuild -version
```

## M1 Mac Specific Notes

- The Podfile has been updated with M1 Mac compatibility fixes
- If you encounter arm64 simulator issues, the Podfile will handle them automatically
- Use Rosetta Terminal if you encounter any Intel-specific issues

## Still Having Issues?

1. Check the React Native troubleshooting guide: https://reactnative.dev/docs/troubleshooting
2. Ensure you're using the latest stable versions of all tools
3. Try running on a physical device instead of simulator
4. Check Xcode console for detailed error messages
