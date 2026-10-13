# ProjectFlow

A student project management portal. Teams create projects, break them into tasks on a Kanban board, track deadlines and talk in comments, while mentors and admins keep an eye on progress.

Stack: React 18, Vite, Tailwind CSS, Recharts, Node.js, Express, PostgreSQL, JWT.

## Features

- JWT authentication with Student, Mentor and Admin roles
- Project and task CRUD, with team members and a mentor per project
- Kanban board with drag and drop, plus button controls for touch and keyboard
- List view, search, and priority and assignee filters
- Due dates with overdue and due soon indicators
- Comments on every task
- In app notifications for assignments, comments, status changes and new projects
- Dashboard analytics: overall flow bar, weekly activity, status donut, project progress, next deadlines
- Profile page with avatar color, bio and password change
- Admin team page to change roles and remove accounts
- Dark and light mode, responsive layout with a mobile tab bar, loading, empty and error states
- Accessible dialogs, visible focus, skip link, reduced motion support

## Project structure

```
projectflow/
  backend/
    src/
      config/        database pool and transaction helper
      db/            schema.sql, migrate.js, seed.js
      middleware/    auth, validation, error handling
      routes/        auth, users, projects, tasks, comments, notifications, analytics
      utils/         access rules, notifications, SQL helpers
      app.js
      server.js
  frontend/
    src/
      api/           http client, mock client, demo data
      components/    layout, ui, projects, tasks
      context/       auth, theme, toast, notifications
      hooks/
      lib/           constants, dates, analytics helpers
      pages/
  docker-compose.yml
```

## Quick start with demo data (no backend needed)

The frontend ships with a mock API that stores data in your browser. This is the fastest way to explore the UI.

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and use one of the demo accounts on the sign in page.

## Full stack setup

1. Start PostgreSQL. With Docker: `docker compose up -d`. Or create a database and user yourself.
2. Configure the API:

```
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

`db:setup` creates the tables and loads demo data. Set a strong `JWT_SECRET` in `.env` before deploying.

3. Point the frontend at the API:

```
cd frontend
echo "VITE_USE_MOCK=false" > .env
npm install
npm run dev
```

Vite proxies `/api` to http://localhost:5000 during development. For production, build the frontend and set `VITE_API_URL` to the public API address, then set `CLIENT_URL` on the API to your frontend origin.

## Demo accounts

Password for all accounts is `Password123!`

| Role    | Email                    |
| - | - |
| Student | student@projectflow.dev  |
| Mentor  | mentor@projectflow.dev   |
| Admin   | admin@projectflow.dev    |

More students: leo@, mei@ and omar@projectflow.dev. Another mentor: marcus@projectflow.dev.

## Permissions

| Action                       | Student            | Mentor                     | Admin |
| - | - | - | - |
| See projects                 | Own and joined     | Mentored and joined        | All   |
| Create projects              | Yes                | Yes                        | Yes   |
| Edit project, manage team    | Owner              | Owner or project mentor    | Yes   |
| Delete project               | Owner              | Owner                      | Yes   |
| Create, edit, move tasks     | Project members    | Project members            | Yes   |
| Delete task                  | Creator or owner   | Creator, owner or mentor   | Yes   |
| Change roles, delete users   | No                 | No                         | Yes   |

## REST API

All routes except register and login need `Authorization: Bearer <token>`.

| Method | Path                                   | Purpose                              |
| - | - | - |
| POST   | /api/auth/register                     | Create an account                    |
| POST   | /api/auth/login                        | Sign in                              |
| GET    | /api/auth/me                           | Current user                         |
| GET    | /api/users                             | Directory, filter by role or search  |
| PATCH  | /api/users/me                          | Update profile                       |
| PATCH  | /api/users/me/password                 | Change password                      |
| PATCH  | /api/users/:id/role                    | Change role (admin)                  |
| DELETE | /api/users/:id                         | Delete user (admin)                  |
| GET    | /api/projects                          | List, filter by search and status    |
| POST   | /api/projects                          | Create                               |
| GET    | /api/projects/:id                      | Details with members and counts      |
| PUT    | /api/projects/:id                      | Update                               |
| DELETE | /api/projects/:id                      | Delete                               |
| POST   | /api/projects/:id/members              | Add member                           |
| DELETE | /api/projects/:id/members/:userId      | Remove member                        |
| GET    | /api/tasks                             | List, filter by project, status, priority, assignee, search |
| POST   | /api/tasks                             | Create                               |
| PUT    | /api/tasks/:id                         | Update                               |
| PATCH  | /api/tasks/:id/move                    | Move to a column and position        |
| DELETE | /api/tasks/:id                         | Delete                               |
| GET    | /api/tasks/:id/comments                | List comments                        |
| POST   | /api/tasks/:id/comments                | Add comment                          |
| DELETE | /api/comments/:id                      | Delete comment                       |
| GET    | /api/notifications                     | List notifications                   |
| PATCH  | /api/notifications/:id/read            | Mark one as read                     |
| POST   | /api/notifications/read-all            | Mark all as read                     |
| GET    | /api/analytics/overview                | Dashboard numbers                    |

## Deployment notes

- Run `npm run build` in `frontend` and serve `dist` from any static host. Add a rewrite of all paths to `index.html` for client side routing.
- Run the API with `npm start`. Provide `DATABASE_URL`, `JWT_SECRET` and `CLIENT_URL` as environment variables.
- Run `npm run db:migrate` on each release. It is safe to repeat. Only run `db:seed` on development databases because it clears existing data.

## Ideas for next steps

Email reminders for due dates, file attachments, activity history per task, and refresh tokens.
