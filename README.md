# 🚀 ProjectFlow: Full-Stack Project Management SaaS

Welcome to **ProjectFlow**! This is a production-ready, full-stack project management application built to help teams organize, track, and collaborate on their daily tasks. Think of it like a lightweight, blazingly fast version of Jira or Trello, packed with a beautifully responsive Light/Dark mode UI.

---

## 🌟 What Does It Do?

At its core, ProjectFlow gives teams a centralized hub to manage their workflows. Here is what you can do out of the box:

- **🔐 Secure Authentication:** Users can securely sign up, log in, and manage their sessions using industry-standard JWT (JSON Web Tokens).
- **🎨 Premium Kanban Boards:** Visualize your workflow! Create projects and drag-and-drop tasks across "To Do", "In Progress", and "Done" columns. The board updates instantly.
- **🌓 Dynamic Light & Dark Mode:** A meticulously designed UI using Tailwind CSS that smoothly transitions between light and dark themes based on your preference.
- **👑 Role-Based Access Control (RBAC):** Not everyone should have the keys to the castle. Regular **Members** can manage their own tasks, while **Admins** get exclusive access to an Admin Panel to delete projects, manage users, and promote teammates.
- **⚡ Unified Deployment:** The React frontend and Express backend are seamlessly woven together to deploy as a single, highly efficient monolith container.

---

## 🏗️ How Does It Work? (The Tech Stack)

The application is built on a modern, robust JavaScript stack:

### Frontend (The Face of the App)
- **React & Vite:** For a lightning-fast development experience and highly responsive user interface.
- **Tailwind CSS:** For pixel-perfect, responsive styling and theme management.
- **Lucide React:** Beautiful, lightweight icons.
- **React Hot Toast:** For those buttery-smooth notification popups when you complete a task.

### Backend (The Brains)
- **Node.js & Express.js:** A fast, scalable server handling all API requests, routing, and static file serving.
- **Prisma ORM:** The absolute best way to interact with the database. It provides strict type-safety and seamless database migrations.
- **PostgreSQL:** A powerful, open-source relational database hosting all our users, projects, and tasks.
- **Bcrypt & JSONWebToken:** Handling password hashing and secure, stateless user sessions.

---

## 🗺️ Important Endpoints

The backend exposes a clean, RESTful API. Here are the heavy hitters:

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Registers a new user and securely hashes their password.
- `POST /api/auth/login` - Authenticates a user and returns a signed JWT.

### Projects (`/api/projects`)
- `GET /api/projects` - Fetches all projects the current user has access to.
- `POST /api/projects` - Creates a brand new project workspace.
- `GET /api/projects/:id` - Retrieves a specific project along with all its nested tasks and assignees.
- `DELETE /api/projects/:id` - (Admin Only) Deletes a project and cascades the deletion to all associated tasks.

### Tasks (`/api/tasks`)
- `POST /api/tasks` - Creates a new task inside a specific project.
- `PATCH /api/tasks/:id/status` - The magic endpoint behind the drag-and-drop! Updates a task's status (e.g., from TODO to DONE).
- `DELETE /api/tasks/:id` - (Admin Only) Removes a task from the board.

### Admin Features (`/api/auth`)
- `GET /api/auth/users` - (Admin Only) Fetches a list of all registered users on the platform.
- `PATCH /api/auth/:id/promote` - (Admin Only) Promotes a standard user to an Admin role.

---

## 🚀 How to Run It Locally

Want to tinker with the code? It's incredibly easy to spin up on your own machine.

### 1. Prerequisites
- Node.js (v18+)
- A running PostgreSQL database (or a free one from Railway/Neon)

### 2. Environment Setup
Create a `.env` file in the root directory and add the following:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/project_manager"
JWT_SECRET="super-secret-local-key"
PORT=5000
```

### 3. Install & Start
Because this is a beautifully configured monorepo, you can run everything from the root folder!

```bash
# Install dependencies for both the server and client
npm install
cd client && npm install && cd ..

# Generate the Prisma Database Client
npx prisma generate

# Push the database schema to your Postgres instance
npx prisma db push

# Start BOTH the frontend and backend simultaneously!
npm run dev
```

Your backend will boot up on `http://localhost:5000` and your frontend will be hot-reloading on `http://localhost:5173`. 

---

## 🌍 Production Deployment

This project is configured to deploy effortlessly on platforms like **Railway** or **Render** as a single service.

When `NODE_ENV=production`, the Express server acts as a monolith: it intercepts all `/api` requests to serve data, and routes all other traffic to the pre-built React static files in `client/dist`. This eliminates CORS issues and reduces hosting costs!

**Build Command:** `npm run build` *(Builds Prisma and React)*  
**Start Command:** `npm start` *(Starts the Express server)*

---
*Built with ❤️ and a lot of caffeine.*
