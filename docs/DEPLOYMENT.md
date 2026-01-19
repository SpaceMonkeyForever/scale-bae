# Deploying scale-bae on a Linux Server

This guide walks you through hosting scale-bae on a Linux server (Ubuntu/Debian).

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- Root or sudo access
- Domain name (optional, for HTTPS)

## 1. Create a Dedicated User

```bash
# Create a new user for the app
sudo adduser scalebae

# Add to sudo group (optional, for initial setup)
sudo usermod -aG sudo scalebae

# Switch to the new user
sudo su - scalebae
```

## 2. Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

## 3. Install Git and Clone the Repository

```bash
# Install git
sudo apt-get install -y git

# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone the repository
# git clone git@github.com:SpaceMonkeyForever/scale-bae.git

# If using HTTPS instead of SSH:
git clone https://github.com/SpaceMonkeyForever/scale-bae.git

cd scale-bae

```

## 4. Install Dependencies and Build

```bash
# Install dependencies
npm install

# Generate the database
npm run db:generate
npm run db:push

# Build the production app
npm run build
```

## 5. Configure Environment Variables

```bash
# Create .env file
cp .env.example .env
nano .env
```

Add the following content:

```env
# Required: Your Anthropic API key for Claude Vision OCR
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Required: Session secret (generate a random 32+ character string)
SESSION_SECRET=your-super-secret-session-key-at-least-32-chars

# Optional: Set to production
NODE_ENV=production
```

Generate a secure session secret:

```bash
openssl rand -base64 32
```

## 6. Run with PM2 (Process Manager)

PM2 keeps your app running and restarts it if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app
pm2 start npm --name "scale-bae" -- start

# Save the process list (survives reboot)
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command it outputs with sudo
```

### Useful PM2 Commands

```bash
pm2 status          # Check app status
pm2 logs scale-bae  # View logs
pm2 restart scale-bae  # Restart the app
pm2 stop scale-bae  # Stop the app
pm2 delete scale-bae  # Remove from PM2
```

## 7. Set Up Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/scale-bae
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for image uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;

        # Increase max upload size (for scale photos)
        client_max_body_size 10M;
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/scale-bae /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 8. Set Up HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d scale-bae.com -d www.scale-bae.com

# Auto-renewal is set up automatically
# Test it with:
sudo certbot renew --dry-run
```

## 9. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 10. Updating the App

When you need to update to a new version:

```bash
cd ~/apps/scale-bae

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Run migrations if schema changed
npm run db:push

# Restart the app
pm2 restart scale-bae
```

## Troubleshooting

### Check if the app is running

```bash
pm2 status
curl http://localhost:3000
```

### View application logs

```bash
pm2 logs scale-bae --lines 100
```

### View Nginx logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Database issues

The SQLite database is stored at `scale-bae.db` in the project root. To reset:

```bash
rm scale-bae.db
npm run db:push
```

### Permission issues

```bash
# Make sure the scalebae user owns the app directory
sudo chown -R scalebae:scalebae ~/apps/scale-bae
```

## Quick Start Summary

```bash
# As root/sudo user
adduser scalebae
su - scalebae

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Clone and build
git clone https://github.com/SpaceMonkeyForever/scale-bae.git ~/apps/scale-bae
cd ~/apps/scale-bae
npm install
npm run db:generate && npm run db:push
npm run build

# Configure
echo "ANTHROPIC_API_KEY=your-key" > .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env

# Run with PM2
sudo npm install -g pm2
pm2 start npm --name "scale-bae" -- start
pm2 save && pm2 startup
```

Your app should now be running at `http://your-server-ip:3000` (or through Nginx at port 80).
