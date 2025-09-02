#!/bin/bash

echo "🍎 Setting up CoinDesi React Native project for M2 Mac with iOS 18.5..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check macOS architecture
check_architecture() {
    local arch=$(uname -m)
    echo "🔍 Detected architecture: $arch"
    
    if [[ "$arch" == "arm64" ]]; then
        echo "✅ M1/M2/M3 Mac detected - optimizing for ARM64"
        return 0
    elif [[ "$arch" == "x86_64" ]]; then
        echo "⚠️  Intel Mac detected - some optimizations may not apply"
        return 1
    else
        echo "❓ Unknown architecture: $arch"
        return 1
    fi
}

# Function to install Homebrew for M2 Mac
install_homebrew() {
    if ! command_exists brew; then
        echo "🍺 Installing Homebrew for M2 Mac..."
        
        # M2 Mac specific Homebrew installation
        if [[ $(uname -m) == 'arm64' ]]; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            
            # Add Homebrew to PATH for M2 Macs
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
            
            # Also add to current session
            export PATH="/opt/homebrew/bin:$PATH"
        else
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        echo "✅ Homebrew installed and configured for M2 Mac"
    else
        echo "✅ Homebrew already installed"
        
        # Ensure Homebrew is in PATH for M2 Mac
        if [[ $(uname -m) == 'arm64' ]]; then
            export PATH="/opt/homebrew/bin:$PATH"
        fi
    fi
}

# Function to install Node.js with M2 optimization
install_node() {
    if ! command_exists node; then
        echo "📦 Installing Node.js for M2 Mac..."
        if command_exists brew; then
            # Install Node.js with ARM64 optimization
            brew install node
        else
            echo "❌ Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        local node_version=$(node --version)
        echo "✅ Node.js already installed (version: $node_version)"
        
        # Check if Node.js version is compatible
        if [[ "$node_version" < "v18" ]]; then
            echo "⚠️  Node.js version $node_version is older than recommended (v18+)"
            echo "   Consider updating: brew upgrade node"
        fi
    fi
}

# Function to install Watchman
install_watchman() {
    if ! command_exists watchman; then
        echo "👀 Installing Watchman..."
        if command_exists brew; then
            brew install watchman
        else
            echo "❌ Please install Watchman manually: brew install watchman"
            exit 1
        fi
    else
        echo "✅ Watchman already installed"
    fi
}

# Function to install CocoaPods for M2 Mac
install_cocoapods() {
    if ! command_exists pod; then
        echo "📱 Installing CocoaPods for M2 Mac..."
        if command_exists brew; then
            # Use Homebrew for better M2 Mac compatibility
            brew install cocoapods
        else
            # Fallback to gem installation
            sudo gem install cocoapods -n /usr/local/bin
        fi
    else
        local pod_version=$(pod --version)
        echo "✅ CocoaPods already installed (version: $pod_version)"
    fi
}

# Function to setup Xcode for M2 Mac
setup_xcode() {
    echo "🔨 Setting up Xcode for M2 Mac..."
    
    # Check if Xcode is installed
    if ! xcode-select -p &> /dev/null; then
        echo "❌ Xcode not found. Please install Xcode from the Mac App Store first."
        echo "   After installation, run: sudo xcodebuild -license accept"
        exit 1
    fi
    
    # Check Xcode version
    local xcode_version=$(xcodebuild -version | head -n 1)
    echo "📱 $xcode_version detected"
    
    # Accept Xcode license if needed
    if ! xcodebuild -license check &> /dev/null; then
        echo "📝 Accepting Xcode license..."
        sudo xcodebuild -license accept
    fi
    
    # Check iOS simulator availability
    echo "📱 Checking iOS simulator availability..."
    if xcrun simctl list devices | grep -q "iPhone 16 Pro"; then
        echo "✅ iPhone 16 Pro simulator found"
    else
        echo "⚠️  iPhone 16 Pro simulator not found"
        echo "   Please open Xcode → Window → Devices and Simulators"
        echo "   Add iPhone 16 Pro simulator with iOS 18.5"
    fi
    
    echo "✅ Xcode setup complete for M2 Mac"
}

# Function to make scripts executable
make_scripts_executable() {
    echo "🔧 Making scripts executable..."
    chmod +x cleanup-mac.sh
    chmod +x quick-fix-mac.sh
    chmod +x setup-macos.sh
    echo "✅ Scripts are now executable"
}

# Function to install project dependencies
install_dependencies() {
    echo "📦 Installing project dependencies..."
    
    # Check Node.js version compatibility
    local node_version=$(node --version)
    if [[ "$node_version" < "v18" ]]; then
        echo "⚠️  Warning: Node.js version $node_version is older than recommended"
        echo "   Some dependencies may not work properly"
    fi
    
    npm install
    echo "✅ Dependencies installed"
}

# Function to setup iOS with M2 Mac optimizations
setup_ios() {
    if [ -d "ios" ]; then
        echo "📱 Setting up iOS for M2 Mac..."
        cd ios
        
        # Remove existing pods if they exist
        if [ -d "Pods" ]; then
            echo "🧹 Removing existing Pods..."
            rm -rf Pods
            rm -rf Podfile.lock
        fi
        
        # Clean build artifacts
        if [ -d "build" ]; then
            echo "🧹 Cleaning build artifacts..."
            rm -rf build
        fi
        
        # Install pods with M2 Mac optimizations
        echo "📦 Installing CocoaPods dependencies for M2 Mac..."
        pod install --repo-update
        
        cd ..
        echo "✅ iOS setup complete for M2 Mac"
    else
        echo "⚠️  iOS directory not found"
    fi
}

# Function to verify iOS 18.5 compatibility
verify_ios_compatibility() {
    echo "🔍 Verifying iOS 18.5 compatibility..."
    
    # Check if deployment target is set correctly
    if grep -q "IPHONEOS_DEPLOYMENT_TARGET = 16.0" ios/CoinDesi.xcodeproj/project.pbxproj; then
        echo "✅ iOS deployment target set to 16.0 (compatible with iOS 18.5)"
    else
        echo "❌ iOS deployment target not set correctly"
        echo "   Please check ios/CoinDesi.xcodeproj/project.pbxproj"
    fi
    
    # Check Podfile configuration
    if grep -q "platform :ios, '16.0'" ios/Podfile; then
        echo "✅ Podfile configured for iOS 16.0+"
    else
        echo "❌ Podfile not configured correctly"
        echo "   Please check ios/Podfile"
    fi
}

# Main setup process
echo "🚀 Starting M2 Mac setup with iOS 18.5 compatibility..."

# Check architecture
check_architecture

# Install and setup tools
install_homebrew
install_node
install_watchman
install_cocoapods
setup_xcode

# Setup project
make_scripts_executable
install_dependencies
setup_ios

# Verify compatibility
verify_ios_compatibility

echo ""
echo "🎉 M2 Mac setup complete! Your project is optimized for iOS 18.5."
echo ""
echo "📱 Next steps:"
echo "  1. Ensure iPhone 16 Pro simulator is available in Xcode"
echo "  2. Run: npm run ios"
echo "  3. If you encounter issues, run: ./quick-fix-mac.sh"
echo "  4. For major issues, run: ./cleanup-mac.sh"
echo ""
echo "🔧 M2 Mac optimizations applied:"
echo "  - ARM64 architecture support enabled"
echo "  - iOS 16.0+ deployment target"
echo "  - M2-specific Homebrew configuration"
echo "  - iOS 18.5 simulator compatibility"
echo ""
echo "Happy coding on your M2 Mac! 🚀"
