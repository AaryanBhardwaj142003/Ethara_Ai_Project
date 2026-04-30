# ProjectFlow — Project Management App

A production-ready, full-stack Project Management SaaS application built with modern tooling and clean architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL + Prisma ORM |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Auth** | JWT + bcryptjs |
| **Icons** | Lucide React |
| **Toasts** | react-hot-toast |
| **Deployment** | Railway |

## Features

- ✅ **JWT Authentication** — Signup/Login with secure bcrypt hashing
- ✅ **RBAC** — Admin and Member roles with middleware enforcement
- ✅ **Project Management** — Create, update, archive, and delete projects
- ✅ **Task Management** — Full CRUD with due dates, assignees, and status
- ✅ **Kanban Board** — Drag-and-drop with HTML5 DnD API and optimistic updates
- ✅ **Dashboard** — Metrics, My Tasks, and recent projects
- ✅ **Empty States** — Friendly UI for empty lists
- ✅ **Toast Notifications** — Global success/error feedback
- ✅ **Responsive** — Mobile sidebar drawer + collapsible desktop sidebar
- ✅ **Error Handling** — Global backend error handler + try/catch on frontend

## Getting Started

### 1. Clone & Install

```bash
cd project-manager

# Install root (backend) dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string and a JWT secret:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/project_manager"
JWT_SECRET="your-super-secret-key"
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
# When prompted, name the migration: init
```

This creates all tables defined in `prisma/schema.prisma`.

### 4. Start Development Servers

```bash
npm run dev
```

This runs both backend (`:5000`) and frontend (`:5173`) concurrently.

### 5. Open the App

Navigate to [http://localhost:5173](http://localhost:5173)

Create an **Admin** account first to manage projects and tasks.

---

## Project Structure

```
project-manager/
├── prisma/schema.prisma        # Database models
├── server/
│   ├── middleware/auth.js      # JWT + RBAC middleware
│   ├── controllers/            # Business logic
│   ├── routes/                 # Express routers
│   ├── lib/prisma.js           # Prisma singleton
│   └── index.js                # App entry point
└── client/src/
    ├── api/axios.js            # Axios instance + interceptors
    ├── context/AuthContext.jsx # Global auth state
    ├── components/             # Reusable UI components
    └── pages/                  # Route-level pages
```

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login (returns JWT)
- `GET  /api/auth/me` — Get current user
- `GET  /api/auth/users` — List all users (ADMIN)

### Projects
- `GET    /api/projects` — List projects
- `POST   /api/projects` — Create project (ADMIN)
- `GET    /api/projects/:id` — Project details + tasks
- `PUT    /api/projects/:id` — Update project (ADMIN)
- `DELETE /api/projects/:id` — Delete project (ADMIN)
- `POST   /api/projects/:id/members` — Add member (ADMIN)
- `DELETE /api/projects/:id/members/:userId` — Remove member (ADMIN)

### Tasks
- `GET    /api/tasks/metrics` — Dashboard metrics
- `GET    /api/tasks/my` — My assigned tasks
- `POST   /api/tasks` — Create task (ADMIN)
- `PUT    /api/tasks/:id` — Update task (ADMIN)
- `PATCH  /api/tasks/:id/status` — Update status (own tasks for MEMBER)
- `DELETE /api/tasks/:id` — Delete task (ADMIN)

## Deployment (Railway)

1. Push to GitHub
2. Create a Railway project, add a PostgreSQL plugin
3. Set environment variables in Railway dashboard
4. Add build command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Add start command: `node server/index.js`
6. Deploy the client separately on Vercel/Netlify pointing to the Railway backend URL
