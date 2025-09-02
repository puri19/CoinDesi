# Mac Setup Guide for CoinDesi React Native Project

## 🚀 Quick Start (Recommended)

### For M2/M3 Macs (Recommended)
```bash
chmod +x setup-m2-mac.sh
./setup-m2-mac.sh
```

### For All Macs
```bash
chmod +x setup-macos.sh
./setup-macos.sh
```

These scripts will automatically:
- Install all required tools (Homebrew, Node.js, Watchman, CocoaPods)
- Set up Xcode properly
- Install project dependencies
- Configure iOS pods
- Make all scripts executable
- **M2 Mac specific**: Optimize for ARM64 architecture and iOS 18.5

## 📱 iOS 18.5 Compatibility

**Important**: This project is now configured for:
- **Minimum iOS**: 16.0
- **Target iOS**: 18.5 (iPhone 16 Pro simulator)
- **Architecture**: ARM64 (M2 Mac optimized)

## Prerequisites

### 1. Install Xcode
- Download and install Xcode from the Mac App Store
- Install Command Line Tools: `xcode-select --install`
- Accept Xcode license: `sudo xcodebuild -license accept`

### 2. Install Homebrew (if not using setup script)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Install Required Tools (if not using setup script)
```bash
# Install Node.js
brew install node

# Install Watchman (required for React Native)
brew install watchman

# Install CocoaPods
brew install cocoapods
# Alternative: sudo gem install cocoapods -n /usr/local/bin
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

## Available Scripts

### 🍎 `setup-m2-mac.sh` - M2 Mac Optimized Setup
- **Use this for M2/M3 Macs** with iOS 18.5 simulator
- Installs all required tools automatically
- Optimizes for ARM64 architecture
- Verifies iOS 18.5 compatibility
- **Recommended for your setup!**

### 🍎 `setup-macos.sh` - Complete Setup
- **Use this for all Macs** or when setting up on a new Mac
- Installs all required tools automatically
- Sets up the entire development environment

### 🚀 `quick-fix-mac.sh` - Quick Troubleshooting
- **Use this for common issues** like pod install failures
- Performs quick cleanup without removing everything
- Installs missing tools if needed

### 🧹 `cleanup-mac.sh` - Full Reset
- **Use this for major issues** or when nothing else works
- Removes all build artifacts and dependencies
- Complete fresh start

## Common Issues and Solutions

### Issue 1: Pod Install Fails
```bash
# Quick fix
./quick-fix-mac.sh

# Or manual fix
cd ios
rm -rf Pods
rm -rf Podfile.lock
pod install --repo-update
```

### Issue 2: Build Errors
```bash
# Quick fix
./quick-fix-mac.sh

# Or manual fix
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ..
npm run ios
```

### Issue 3: Simulator Issues
- Open Xcode → Window → Devices and Simulators
- Create iPhone 16 Pro simulator with iOS 18.5
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
brew install cocoapods
```

## Troubleshooting Commands

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

# Check Homebrew
brew --version

# Check macOS architecture
uname -m
```

### Manual Cleanup (if scripts don't work)
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

## M2 Mac Specific Notes

- **Use `setup-m2-mac.sh`** for optimal M2 Mac performance
- **ARM64 architecture** is fully supported and optimized
- **iOS 18.5 simulator** compatibility is verified
- **Homebrew is configured** for `/opt/homebrew` path
- **No Rosetta needed** - native ARM64 performance

## iOS 18.5 Simulator Setup

1. **Open Xcode**
2. **Go to Window → Devices and Simulators**
3. **Click the "+" button** to add a new simulator
4. **Choose iPhone 16 Pro** with iOS 18.5
5. **Verify the simulator** appears in the list

## Still Having Issues?

1. **Run the M2 Mac setup script first**: `./setup-m2-mac.sh`
2. **Check the React Native troubleshooting guide**: https://reactnative.dev/docs/troubleshooting
3. **Ensure you're using the latest stable versions** of all tools
4. **Try running on a physical device** instead of simulator
5. **Check Xcode console** for detailed error messages
6. **Run the cleanup script**: `./cleanup-mac.sh`

## Script Permissions

If you get permission errors, make sure scripts are executable:

```bash
chmod +x setup-m2-mac.sh
chmod +x setup-macos.sh
chmod +x quick-fix-mac.sh
chmod +x cleanup-mac.sh
```
