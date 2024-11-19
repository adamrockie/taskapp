const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key";

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "taskdb",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Middleware for checking token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access Denied");
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
    req.user = user;
    next();
  });
};

// User Registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) return res.status(400).send("Username already exists");
    res.status(201).send("User registered successfully");
  });
});

// User Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).send("User not found");
    const user = results[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send("Invalid password");
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.json({ token });
  });
});

// Get Tasks
app.get("/tasks", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM tasks WHERE user_id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Create Task
app.post("/tasks", authenticateToken, (req, res) => {
  const { title, description, status } = req.body;
  const sql = "INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, description, status, req.user.id], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, title, description, status });
  });
});

// Update Task
app.put("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const sql = "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?";
  db.query(sql, [title, description, status, id, req.user.id], (err, result) => {
    if (err) throw err;
    res.json({ id, title, description, status });
  });
});

// Delete Task
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) throw err;
    res.json({ message: "Task deleted successfully" });
  });
});

// Filter Tasks by Status
app.get("/tasks/filter/:status", authenticateToken, (req, res) => {
  const { status } = req.params;
  const sql = "SELECT * FROM tasks WHERE status = ? AND user_id = ?";
  db.query(sql, [status, req.user.id], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
