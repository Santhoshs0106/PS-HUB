// ============================================
//  PS HUB - Game Library CRUD Application
//  Node.js + Express + EJS + Bootstrap
//  Now with: user/admin accounts, login, and order tracking
// ============================================

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ----------------------------------------------
// SESSIONS
// A session lets the server "remember" who is logged in
// as they move between pages. Express stores a small cookie
// in the browser, and matches it to session data on the server.
// ----------------------------------------------
app.use(session({
  secret: "ps-hub-secret-key", // used to secure the session cookie
  resave: false,
  saveUninitialized: false
}));

// Make the logged-in user available inside every EJS page automatically,
// so we don't have to pass it manually every time.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ----------------------------------------------
// "DATABASE" (in-memory arrays, resets on server restart)
// ----------------------------------------------
let games = [
  { id: 1, name: "God of War Ragnarok", price: 2999, image: "https://placehold.co/150x150" },
  { id: 2, name: "Spider-Man 2", price: 3499, image: "https://placehold.co/150x150" },
  { id: 3, name: "Horizon Forbidden West", price: 2499, image: "https://placehold.co/150x150" },
  { id: 4, name: "Gran Turismo 7", price: 2799, image: "https://placehold.co/150x150" }
];
let nextGameId = 5;

// One admin account is pre-created. Regular users sign up through /register.
let users = [
  {
    id: 1,
    name: "Admin",
    email: "admin@pshub.com",
    password: bcrypt.hashSync("admin123", 10), // never store plain-text passwords
    role: "admin"
  }
];
let nextUserId = 2;

// Every purchase becomes one order, with the buyer's delivery details.
let orders = [];
let nextOrderId = 1;

// ----------------------------------------------
// MIDDLEWARE (gatekeepers that run before certain routes)
// ----------------------------------------------
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Access denied. Admins only. <a href='/'>Go back</a>");
  }
  next();
}

// ================================================
//  AUTH ROUTES
// ================================================

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.render("register", { error: "An account with that email already exists." });
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: "user" // anyone who signs up is a regular user, never an admin
  };
  users.push(newUser);

  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render("login", { error: "Invalid email or password." });
  }

  // Save a safe copy (no password) into the session
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ================================================
//  GAME CRUD ROUTES (admin only)
// ================================================

app.get("/", (req, res) => {
  res.render("index", { games: games });
});

app.post("/add", requireAdmin, (req, res) => {
  const { name, price, image } = req.body;

  games.push({
    id: nextGameId++,
    name,
    price: Number(price),
    image: image && image.trim() !== "" ? image : "https://placehold.co/150x150"
  });

  res.redirect("/");
});

app.get("/edit/:id", requireAdmin, (req, res) => {
  const game = games.find(g => g.id === Number(req.params.id));
  if (!game) return res.send("Game not found. <a href='/'>Go back</a>");
  res.render("edit", { game: game });
});

app.post("/edit/:id", requireAdmin, (req, res) => {
  const game = games.find(g => g.id === Number(req.params.id));
  if (game) {
    const { name, price, image } = req.body;
    game.name = name;
    game.price = Number(price);
    game.image = image && image.trim() !== "" ? image : game.image;
  }
  res.redirect("/");
});

app.post("/delete/:id", requireAdmin, (req, res) => {
  games = games.filter(g => g.id !== Number(req.params.id));
  res.redirect("/");
});

// ================================================
//  BUY / ORDER ROUTES (logged-in users)
// ================================================

// Show the checkout form for one game
app.get("/buy/:id", requireLogin, (req, res) => {
  const game = games.find(g => g.id === Number(req.params.id));
  if (!game) return res.send("Game not found. <a href='/'>Go back</a>");
  res.render("buy", { game: game });
});

// Submit the checkout form -> creates an order
app.post("/buy/:id", requireLogin, (req, res) => {
  const game = games.find(g => g.id === Number(req.params.id));
  if (!game) return res.send("Game not found. <a href='/'>Go back</a>");

  const { fullName, address, phone } = req.body;

  orders.push({
    id: nextOrderId++,
    gameId: game.id,
    gameName: game.name,
    price: game.price,
    buyerName: fullName,
    address,
    phone,
    userEmail: req.session.user.email,
    status: "Pending",
    orderedAt: new Date().toLocaleString()
  });

  res.render("order-confirmation", { game: game });
});

// A user's own order history
app.get("/my-orders", requireLogin, (req, res) => {
  const myOrders = orders.filter(o => o.userEmail === req.session.user.email);
  res.render("my-orders", { orders: myOrders });
});

// ================================================
//  ADMIN: view + manage all orders (who ordered what, deliver to whom)
// ================================================

app.get("/admin/orders", requireAdmin, (req, res) => {
  res.render("admin-orders", { orders: orders });
});

app.post("/admin/orders/:id/deliver", requireAdmin, (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (order) order.status = "Delivered";
  res.redirect("/admin/orders");
});

// ----------------------------------------------
app.listen(PORT, () => {
  console.log(`PS HUB server running at http://localhost:${PORT}`);
  console.log(`Admin login -> email: admin@pshub.com | password: admin123`);
});
