# 🔍 Campus Lost & Found Portal

A full-stack MERN application for campus communities to report lost items, browse found belongings, and coordinate returns through a claim-based workflow.

## ✨ Features

- **User Authentication** — Register, login, and JWT-based session management
- **Item Posting** — Report lost or found items with image uploads (via Multer)
- **Admin Moderation** — Admins approve/reject item listings before they go public
- **Claim System** — Users can claim items; owners can accept/reject claims
- **Self-Resolution** — Owners can mark their own items as resolved
- **Role-Based Access** — User, Admin roles with protected routes
- **Responsive UI** — Tailwind CSS–styled React frontend

## 🏗️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS, React Router v7 |
| Backend    | Node.js, Express, Multer                      |
| Database   | MongoDB Atlas, Mongoose                       |
| Auth       | JWT, bcryptjs                                 |

## 📁 Project Structure

```
Lost_found_Portal/
├── backend/
│   ├── middleware/      # Auth & admin middleware
│   ├── models/          # Mongoose schemas (User, Item, Claim)
│   ├── routes/          # API routes (auth, items, claims, admin)
│   ├── uploads/         # Uploaded images (gitignored)
│   ├── server.js        # Express entry point
│   └── .env.example     # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, PrivateRoute, AdminRoute
│   │   ├── pages/       # Dashboard, AddItem, Admin, Login, Register, Requests
│   │   ├── api.js       # Axios instance
│   │   ├── App.jsx      # Root component with routing
│   │   └── main.jsx     # React entry point
│   └── index.html
├── package.json         # Monorepo root (concurrently scripts)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** Atlas cluster (or local MongoDB instance)

### 1. Clone the repository

```bash
git clone https://github.com/VinayakTiwari7/Lost_found_Portal.git
cd Lost_found_Portal
```

### 2. Set up environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
MONGO_URL=mongodb://your_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Install dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm install
npm run install:all
```

### 4. Run in development

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173`

## 📡 API Endpoints

| Method | Endpoint                          | Description            | Auth     |
|--------|-----------------------------------|------------------------|----------|
| POST   | `/api/auth/register`              | Register a new user    | —        |
| POST   | `/api/auth/login`                 | Login & get JWT        | —        |
| GET    | `/api/items`                      | List approved items    | —        |
| POST   | `/api/items/add`                  | Post a new item        | User     |
| PATCH  | `/api/items/:id/resolve`          | Owner marks resolved   | User     |
| POST   | `/api/claims/:itemId`             | Claim an item          | User     |
| PATCH  | `/api/claims/:id/status`          | Accept/reject a claim  | User     |
| GET    | `/api/admin/items`                | List all items         | Admin    |
| PATCH  | `/api/admin/items/:id/approve`    | Approve an item        | Admin    |
| DELETE | `/api/admin/items/:id`            | Delete an item         | Admin    |

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
