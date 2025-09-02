#!/bin/bash

echo "🚀 Quick Fix for Mac React Native Issues..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📱 Checking environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check CocoaPods
if ! command -v pod &> /dev/null; then
    echo "❌ CocoaPods not found. Installing..."
    sudo gem install cocoapods -n /usr/local/bin
fi

# Check Watchman
if ! command -v watchman &> /dev/null; then
    echo "❌ Watchman not found. Installing..."
    brew install watchman
fi

echo "🧹 Quick cleanup..."

# Quick cleanup without removing everything
cd ios
if [ -d "Pods" ]; then
    echo "Removing old Pods..."
    rm -rf Pods
    rm -rf Podfile.lock
fi

if [ -d "build" ]; then
    echo "Removing old build..."
    rm -rf build
fi
cd ..

echo "📦 Installing pods..."
cd ios
pod install --repo-update
cd ..

echo "✅ Quick fix complete!"
echo ""
echo "Now try running:"
echo "  npm run ios"
echo ""
echo "If you still have issues, run the full cleanup:"
echo "  ./cleanup-mac.sh"
