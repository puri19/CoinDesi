#!/bin/bash

echo "🍎 Setting up CoinDesi React Native project for macOS..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew if not present
install_homebrew() {
    if ! command_exists brew; then
        echo "🍺 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for M1 Macs
        if [[ $(uname -m) == 'arm64' ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        echo "✅ Homebrew already installed"
    fi
}

# Function to install Node.js
install_node() {
    if ! command_exists node; then
        echo "📦 Installing Node.js..."
        if command_exists brew; then
            brew install node
        else
            echo "❌ Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        echo "✅ Node.js already installed (version: $(node --version))"
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

# Function to install CocoaPods
install_cocoapods() {
    if ! command_exists pod; then
        echo "📱 Installing CocoaPods..."
        if command_exists brew; then
            brew install cocoapods
        else
            sudo gem install cocoapods -n /usr/local/bin
        fi
    else
        echo "✅ CocoaPods already installed (version: $(pod --version))"
    fi
}

# Function to setup Xcode
setup_xcode() {
    echo "🔨 Setting up Xcode..."
    
    # Check if Xcode is installed
    if ! xcode-select -p &> /dev/null; then
        echo "❌ Xcode not found. Please install Xcode from the Mac App Store first."
        echo "   After installation, run: sudo xcodebuild -license accept"
        exit 1
    fi
    
    # Accept Xcode license if needed
    if ! xcodebuild -license check &> /dev/null; then
        echo "📝 Accepting Xcode license..."
        sudo xcodebuild -license accept
    fi
    
    echo "✅ Xcode setup complete"
}

# Function to make scripts executable
make_scripts_executable() {
    echo "🔧 Making scripts executable..."
    chmod +x cleanup-mac.sh
    chmod +x quick-fix-mac.sh
    echo "✅ Scripts are now executable"
}

# Function to install project dependencies
install_dependencies() {
    echo "📦 Installing project dependencies..."
    npm install
    echo "✅ Dependencies installed"
}

# Function to setup iOS
setup_ios() {
    if [ -d "ios" ]; then
        echo "📱 Setting up iOS..."
        cd ios
        
        # Remove existing pods if they exist
        if [ -d "Pods" ]; then
            echo "🧹 Removing existing Pods..."
            rm -rf Pods
            rm -rf Podfile.lock
        fi
        
        # Install pods
        echo "📦 Installing CocoaPods dependencies..."
        pod install --repo-update
        
        cd ..
        echo "✅ iOS setup complete"
    else
        echo "⚠️  iOS directory not found"
    fi
}

# Main setup process
echo "🚀 Starting macOS setup..."

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

echo ""
echo "🎉 Setup complete! Your project is ready for macOS development."
echo ""
echo "Next steps:"
echo "  1. Open Xcode and ensure you have a simulator set up"
echo "  2. Run: npm run ios"
echo "  3. If you encounter issues, run: ./quick-fix-mac.sh"
echo "  4. For major issues, run: ./cleanup-mac.sh"
echo ""
echo "Happy coding! 🚀"
