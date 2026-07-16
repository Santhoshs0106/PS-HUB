# PS HUB — Game Library (CRUD + User/Admin Accounts)

Built with **Node.js + Express + EJS + Bootstrap**. No JSON file, no frontend JavaScript — every action is a normal page reload via HTML forms.

## How to run it

1. Install [Node.js](https://nodejs.org) if you don't already have it.
2. Open a terminal in this folder.
3. Run:
   ```
   npm install
   ```
4. Run:
   ```
   npm start
   ```
5. Open your browser to **http://localhost:3000**

## Logging in

**Admin account (pre-created, can add/edit/delete games and manage orders):**
- Email: `admin@pshub.com`
- Password: `admin123`

**Regular users:** click "Register" on the homepage to create an account, then log in. Regular users can browse games and place orders, but cannot add/edit/delete games.

## Project structure

```
ps-hub-crud/
├── server.js                  ← all routes: auth, game CRUD, orders
├── package.json
├── views/
│   ├── index.ejs                ← homepage: games list, role-based buttons
│   ├── edit.ejs                  ← admin: edit a game
│   ├── login.ejs                  ← login form
│   ├── register.ejs                ← sign-up form
│   ├── buy.ejs                      ← checkout form (name, address, phone)
│   ├── order-confirmation.ejs        ← shown after placing an order
│   ├── my-orders.ejs                  ← a user's own order history
│   └── admin-orders.ejs                ← admin: see every order + mark delivered
└── public/
    └── Project.css              ← your original styling
```

## How everything maps to the code

| Feature | What happens in the browser | Route in server.js |
|---|---|---|
| Register | Fill sign-up form | `app.post("/register")` |
| Login | Enter email/password | `app.post("/login")` |
| Logout | Click Logout | `app.get("/logout")` |
| **C**reate game (admin) | Fill "Add Game" form | `app.post("/add")` |
| **R**ead games | Visit homepage | `app.get("/")` |
| **U**pdate game (admin) | Click Edit, Save | `app.get("/edit/:id")`, `app.post("/edit/:id")` |
| **D**elete game (admin) | Click Delete | `app.post("/delete/:id")` |
| Buy a game (user) | Click Buy, fill checkout form | `app.get("/buy/:id")`, `app.post("/buy/:id")` |
| View own orders (user) | Click "My Orders" | `app.get("/my-orders")` |
| View all orders (admin) | Click "Manage Orders" | `app.get("/admin/orders")` |
| Mark order delivered (admin) | Click "Mark Delivered" | `app.post("/admin/orders/:id/deliver")` |

## How the roles work

- Every account has a `role`: either `"admin"` or `"user"`.
- When someone logs in, their role is stored in the session (`req.session.user`).
- Certain routes are protected by two "gatekeeper" functions in `server.js`:
  - `requireLogin` — blocks anyone not logged in (used for buying, viewing orders)
  - `requireAdmin` — blocks anyone who isn't an admin (used for add/edit/delete games, and viewing all orders)
- The EJS pages also hide buttons a user shouldn't see (e.g. a regular user never sees "Add Game"), but the real protection happens in `server.js` — hiding a button is just for a cleaner interface, not real security.

## Important notes on data storage

Everything (games, users, orders) is stored in plain JavaScript arrays inside `server.js`, in memory. This means:
- All CRUD, login, and ordering works instantly while the server runs.
- **If you restart the server, all of it resets** — games go back to the 4 starter items, all registered users and orders are gone (only the built-in admin account remains). This is normal for a course project without a real database and still fully demonstrates every requirement (CRUD, login system, order tracking).
- Passwords are hashed with bcrypt before being stored (never stored as plain text) — this is genuinely how production apps should always handle passwords, even here.

## What to say if asked to explain it

- **Sessions** let the server remember who's logged in as they move between pages, using a cookie.
- **Middleware** (`requireLogin`, `requireAdmin`) are functions that run *before* a route, checking permissions and blocking access if needed.
- **bcrypt** is a library that scrambles ("hashes") passwords so the server never stores what the user actually typed.
- No database is used — arrays act as an in-memory data store, which is standard for a small demo/learning project.
