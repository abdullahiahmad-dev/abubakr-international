const bcrypt = require("bcrypt");
const Teacher = require("../models/Teacher");

// GET Login Page
exports.getLogin = (req, res) => {
  res.render("auth/login", { message: null });
};

// POST Login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if default admin login
    if (email === "ahmsal" && password === "admin") {
      req.session.user = { 
        role: "admin", 
        fullName: "Administrator",
        email: "ahmsal",
        isDefaultAdmin: true // Flag to identify the default admin
      };
      return res.redirect("/dashboard");
    }

    // 2. Check if a user (teacher or admin) exists in the database
    const user = await Teacher.findOne({ email });
    if (!user) {
      return res.render("auth/login", { message: "Invalid credentials" });
    }

    // 3. Compare the provided password with the stored hash
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.render("auth/login", { message: "Invalid credentials" });
    }

    // 4. If credentials are valid, create a session
    // The role is now taken directly from the user's document in the database
    req.session.user = { 
      role: user.role, // This will be "admin" or "teacher" based on the database
      fullName: user.fullName,
      email: user.email,
      id: user._id // Store the user's ID for future use
    };
    
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    return res.render("auth/login", { message: "An error occurred during login" });
  }
};

// Dashboard route
exports.getDashboard = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
};

// GET Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
