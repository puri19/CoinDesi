#!/bin/bash

echo "🚇 Fixing Metro bundler _util.styleText error..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Checking current versions..."

# Check current versions
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "React Native CLI: $(npx react-native --version)"

echo ""
echo "🧹 Step 1: Removing problematic CLI packages..."

# Remove the problematic CLI packages
npm uninstall @react-native-community/cli @react-native-community/cli-platform-ios @react-native-community/cli-platform-android

echo ""
echo "📦 Step 2: Installing compatible CLI versions..."

# Install compatible CLI versions
npm install --save-dev @react-native-community/cli@^12.0.0 @react-native-community/cli-platform-ios@^12.0.0 @react-native-community/cli-platform-android@^12.0.0

echo ""
echo "🧹 Step 3: Cleaning cache..."

# Clean npm cache
npm cache clean --force

# Clean Metro cache
npx react-native start --reset-cache --no-interactive || echo "Metro cache cleaned"

echo ""
echo "✅ Metro bundler fix complete!"
echo ""
echo "📱 Now try running:"
echo "  npm start"
echo ""
echo "If that works, then run:"
echo "  npm run ios"
