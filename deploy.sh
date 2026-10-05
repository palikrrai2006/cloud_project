#!/bin/bash
# One-command deploy for TaskFlow on a fresh EC2 instance (Amazon Linux 2023 or Ubuntu).
# Run from inside the project folder:  bash deploy.sh
set -e
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing Node.js, npm and nginx"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nodejs npm nginx
else
  sudo dnf install -y nodejs npm nginx
fi

echo "==> Installing app dependencies"
cd "$APP_DIR"
npm install --omit=dev

echo "==> Starting app with pm2"
sudo npm install -g pm2
pm2 delete taskflow >/dev/null 2>&1 || true
PORT=3000 pm2 start server.js --name taskflow
pm2 save
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null

echo "==> Configuring nginx (port 80 -> app on 3000)"
sudo rm -f /etc/nginx/sites-enabled/default
sudo tee /etc/nginx/conf.d/taskflow.conf >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
echo ""
echo "Done! Open: http://${IP:-<your-ec2-public-ip>}"
