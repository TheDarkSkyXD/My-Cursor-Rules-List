#!/bin/bash

# Stop script on errors
set -e

# --- Configuration ---
# !!! IMPORTANT: Replace these placeholders with your actual values !!!
GIT_REPO_URL="https://github.com/mauriciobc/mealtime" # e.g., git@github.com:your_username/mealtime.git
PROJECT_DIR="/home/apps/mealtime"    # Directory where the app will live on the server
APP_NAME="mealtime-app"                # Name for the PM2 process
NODE_VERSION="20"                      # Specify the desired Node.js major version (e.g., 18, 20)

# --- Permission Checks ---
# Check if script is run as root
if [ "$EUID" -eq 0 ]; then
  echo "Please do not run this script as root"
  exit 1
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
  echo "sudo is required but not installed. Please install sudo first."
  exit 1
fi

# Ensure the user has sudo privileges
if ! sudo -v &> /dev/null; then
  echo "Current user does not have sudo privileges. Please add user to sudoers."
  exit 1
fi

# --- Deployment Steps ---

echo "Starting deployment..."

# 1. Server Setup (Run once or ensure these are installed)
echo "Updating package list and installing dependencies..."
sudo apt-get update
sudo apt-get install -y curl git nginx # Install Git and Nginx (optional, for reverse proxy)

# Install Node.js using NodeSource
# See: https://github.com/nodesource/distributions
echo "Checking for Node.js v$NODE_VERSION..."
if ! command -v node > /dev/null || [[ $(node -v | cut -d. -f1) != "v$NODE_VERSION" ]]; then
  echo "Installing Node.js v$NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js v$NODE_VERSION already installed."
fi

# Install PM2 globally (Process manager for Node.js)
echo "Checking for PM2..."
if ! command -v pm2 > /dev/null; then
  echo "Installing PM2 globally..."
  sudo npm install pm2 -g
else
  echo "PM2 already installed."
fi

# 2. Code Deployment
echo "Deploying code..."
if [ -d "$PROJECT_DIR" ]; then
  echo "Project directory exists. Pulling latest changes..."
  cd "$PROJECT_DIR"
  
  # Create backup
  BACKUP_DIR="/home/apps/backups/mealtime-$(date +%Y%m%d_%H%M%S)"
  echo "Creating backup at $BACKUP_DIR..."
  mkdir -p "$BACKUP_DIR"
  cp -r "$PROJECT_DIR"/* "$BACKUP_DIR/"
  
  git checkout main # Or your deployment branch
  git pull origin main
else
  echo "Cloning repository..."
  git clone "$GIT_REPO_URL" "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# Ensure correct directory permissions
echo "Setting up directory permissions..."
sudo chown -R $(whoami):$(whoami) "$PROJECT_DIR"
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;

# 3. Install Dependencies
echo "Installing project dependencies..."
npm install --production # Install only production dependencies

# 4. Setup Environment
# IMPORTANT: Ensure your .env.production file exists in the repo
# or securely copy it to the server at $PROJECT_DIR/.env
echo "Setting up environment variables..."
if [ -f ".env.production" ]; then
  cp .env.production .env
  echo "Copied .env.production to .env"
else
  echo "WARNING: .env.production not found. Attempting to run without it."
  echo "Ensure environment variables are set via PM2 ecosystem file or system environment."
fi

# 5. Database Migrations (Using Prisma)
echo "Running Prisma generate..."
# npx prisma generate # This is already part of your build script, but uncomment if needed separately
echo "Running Prisma migrations..."
npx prisma migrate deploy # Use deploy for production environments

# 6. Build Application
echo "Building Next.js application..."
npm run build

# 7. Start/Restart Application with PM2
echo "Managing application with PM2..."
# Check if the app is already managed by PM2
pm2 describe "$APP_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Restarting existing PM2 process: $APP_NAME..."
  pm2 restart "$APP_NAME" --update-env # Update environment variables if .env changed
else
  echo "Starting new PM2 process: $APP_NAME..."
  # The start script in package.json uses PORT env var or defaults to 10000
  # You can override the port here if needed, or rely on the .env file.
  # Example with specific port: pm2 start npm --name "$APP_NAME" -- start -- -p 3000
  pm2 start npm --name "$APP_NAME" -- start
fi

# Optional: Configure PM2 to start on server boot
pm2 startup systemd # Or appropriate init system
# The following command might require adjustment depending on the system user and environment
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(echo $HOME)
echo "Attempting to configure PM2 startup..."
# Generate the command and print it for the user to run manually if needed
PM2_STARTUP_CMD=$(pm2 startup systemd -u $(whoami) --hp $HOME | tail -n 1)
if [[ -n "$PM2_STARTUP_CMD" ]]; then
  echo "Please run the following command manually to enable PM2 startup:"
  echo "$PM2_STARTUP_CMD"
else
  echo "Could not automatically determine the PM2 startup command. Please run 'pm2 startup' and follow instructions."
fi
pm2 save # Save current process list

echo "Deployment finished successfully!"
echo "Your app '$APP_NAME' should be running."
echo "You can check the status with: pm2 status"
echo "You can view logs with: pm2 logs $APP_NAME"

# --- Optional: Nginx Reverse Proxy Setup ---
# This is a basic example. You'll need to customize it.
# Create/edit Nginx config: /etc/nginx/sites-available/your_domain_or_app
#
# server {
#     listen 80;
#     server_name your_domain.com www.your_domain.com; # Replace with your domain or server IP
#
#     location / {
#         proxy_pass http://localhost:10000; # Match the port your app runs on (default 10000 from your start script)
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
#
# Enable the site: sudo ln -s /etc/nginx/sites-available/your_domain_or_app /etc/nginx/sites-enabled/
# Test config: sudo nginx -t
# Reload Nginx: sudo systemctl reload nginx
# Consider using Certbot for HTTPS: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx 