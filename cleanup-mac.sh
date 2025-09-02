#!/bin/bash

echo "🧹 Cleaning up React Native project for Mac..."

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and reinstall
echo "Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Clean iOS build artifacts
echo "Cleaning iOS build artifacts..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean Android build artifacts (if needed)
cd ../android
rm -rf build
rm -rf app/build
rm -rf .gradle

# Go back to project root
cd ..

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Install iOS pods
echo "Installing iOS pods..."
cd ios
pod install --repo-update
cd ..

echo "✅ Cleanup complete! Now try running:"
echo "  npm run ios"
echo "  or"
echo "  npx react-native run-ios"
