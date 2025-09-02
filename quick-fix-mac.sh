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
    echo "   You can install it from: https://nodejs.org/"
    exit 1
fi

# Check if Homebrew is available
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew not found. Some tools might not be available."
    echo "   Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
fi

# Check CocoaPods
if ! command -v pod &> /dev/null; then
    echo "❌ CocoaPods not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install cocoapods
    else
        sudo gem install cocoapods -n /usr/local/bin
    fi
fi

# Check Watchman
if ! command -v watchman &> /dev/null; then
    echo "❌ Watchman not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install watchman
    else
        echo "⚠️  Please install Watchman manually: brew install watchman"
    fi
fi

echo "🧹 Quick cleanup..."

# Quick cleanup without removing everything
if [ -d "ios" ]; then
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
fi

echo "📦 Installing pods..."
if [ -d "ios" ]; then
    cd ios
    pod install --repo-update
    cd ..
else
    echo "⚠️  iOS directory not found. Skipping pod install."
fi

echo "✅ Quick fix complete!"
echo ""
echo "Now try running:"
echo "  npm run ios"
echo ""
echo "If you still have issues, run the full cleanup:"
echo "  ./cleanup-mac.sh"
