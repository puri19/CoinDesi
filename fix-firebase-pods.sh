#!/bin/bash

echo "🔥 Fixing Firebase pods integration issues..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🧹 Cleaning up existing pods..."

# Navigate to iOS directory
cd ios

# Remove all existing pods and build artifacts
echo "Removing existing Pods..."
rm -rf Pods
rm -rf Podfile.lock
rm -rf build

# Clean CocoaPods cache
echo "Cleaning CocoaPods cache..."
pod cache clean --all

# Go back to project root
cd ..

echo "📦 Reinstalling pods with Firebase fixes..."

# Navigate to iOS directory again
cd ios

# Install pods with repo update
echo "Installing pods..."
pod install --repo-update

# Go back to project root
cd ..

echo "✅ Firebase pods fix complete!"
echo ""
echo "Now try running:"
echo "  npm run ios"
echo ""
echo "If you still have issues, run:"
echo "  ./cleanup-mac.sh"
