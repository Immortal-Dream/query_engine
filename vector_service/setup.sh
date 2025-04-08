#!/bin/bash
# setup.sh - set up project's dependencies

# Function: install Node.js on Debian/Ubuntu
install_node_debian() {
  echo "Installing Node.js on Debian/Ubuntu..."
  curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

# Function: install Node.js on CentOS/RHEL
install_node_centos() {
  echo "Installing Node.js on CentOS/RHEL..."
  curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
  sudo yum install -y nodejs
}

# Check if npm is installed; if not, install Node.js
if ! command -v npm &>/dev/null; then
  echo "npm not found. Installing Node.js and npm..."
  if [ -f /etc/debian_version ]; then
    install_node_debian
  elif [ -f /etc/redhat-release ]; then
    install_node_centos
  else
    echo "Unsupported OS. Please install Node.js and npm manually."
    exit 1
  fi
else
  echo "npm is already installed."
fi

# Initialize the package.json
if [ ! -f package.json ]; then
  echo "Initializing npm project..."
  npm init -y
fi

# install the project dependencies
echo "Installing dependencies: express and axios..."
npm install express axios
npm install @zilliz/milvus2-sdk-node
npm install chalk dayjs

echo "Setup complete. You can now run the project with: node app.js"
