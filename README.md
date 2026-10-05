# TaskFlow – Dynamic To-Do App (Node.js + Express)

Run locally:  npm install && npm start  ->  http://localhost:3000

Deploy on EC2:
1. Launch EC2 (Amazon Linux 2023 or Ubuntu), open ports 22 and 80 in the security group.
2. SSH in, then:  git clone <your-repo-url> && cd cloud_project && bash deploy.sh
3. Open http://<ec2-public-ip>

API: GET/POST /api/todos, PATCH/DELETE /api/todos/:id, DELETE /api/todos/completed, GET /health, GET /api/info
