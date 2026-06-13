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


## 📄 License

This project is open source and available under the [MIT License](LICENSE).
