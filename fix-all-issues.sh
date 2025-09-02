#!/bin/bash

echo "🚀 Fixing all CoinDesi project issues..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Checking current issues..."

# Check Node.js version
echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"

# Check React Native CLI
echo "📱 React Native CLI version: $(npx react-native --version)"

echo ""
echo "🧹 Step 1: Cleaning up dependencies..."

# Remove node_modules and reinstall
echo "Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

echo ""
echo "📦 Step 2: Reinstalling Node.js dependencies..."

# Reinstall dependencies
npm install

echo ""
echo "🔥 Step 3: Fixing Firebase pods..."

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

echo ""
echo "📱 Step 4: Reinstalling iOS pods..."

# Navigate to iOS directory again
cd ios

# Install pods with repo update
echo "Installing pods..."
pod install --repo-update

# Go back to project root
cd ..

echo ""
echo "🔧 Step 5: Making scripts executable..."

# Make all scripts executable
chmod +x *.sh

echo ""
echo "✅ All fixes applied!"
echo ""
echo "📱 Now try running:"
echo "  1. Start Metro: npm start"
echo "  2. In new terminal: npm run ios"
echo ""
echo "🔧 If you still have issues:"
echo "  - Run: ./quick-fix-mac.sh"
echo "  - Or: ./cleanup-mac.sh"
echo ""
echo "🚀 Happy coding!"
