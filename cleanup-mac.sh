#!/bin/bash

echo "🧹 Cleaning up React Native project for Mac..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and reinstall
echo "Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Clean iOS build artifacts
echo "Cleaning iOS build artifacts..."
if [ -d "ios" ]; then
    cd ios
    rm -rf build
    rm -rf Pods
    rm -rf Podfile.lock
    
    # Clean Xcode derived data (only if it exists)
    if [ -d "$HOME/Library/Developer/Xcode/DerivedData" ]; then
        echo "Cleaning Xcode derived data..."
        rm -rf "$HOME/Library/Developer/Xcode/DerivedData"
    fi
    cd ..
fi

# Clean Android build artifacts (if needed)
if [ -d "android" ]; then
    echo "Cleaning Android build artifacts..."
    cd android
    rm -rf build
    rm -rf app/build
    rm -rf .gradle
    cd ..
fi

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Install iOS pods
if [ -d "ios" ]; then
    echo "Installing iOS pods..."
    cd ios
    pod install --repo-update
    cd ..
fi

echo "✅ Cleanup complete! Now try running:"
echo "  npm run ios"
echo "  or"
echo "  npx react-native run-ios"
