const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

const studentRoutes = require("./routes/studentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const AdminRoutes = require("./routes/admin");
const promotonRoutes = require("./routes/promotionRoutes")
const resultRoutes = require("./routes/resultRoutes")
const teacherRoutes = require("./routes/teacherRoutes")
// const classLevel = require("./routes/classLevelRoutes")
const CheckResult = require('./routes/pinRoutes');
const AdminPinRoutes = require("./routes/adminPins");

const { isAuthenticated,isAdmin } = require("./middleware/auth");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const session = require("express-session");

app.use(
  session({
    secret: "myschoolappsecret", // change this to a strong secret
    resave: false,
    saveUninitialized: false
  })
);

// Enhanced middleware to make user and user.role accessible in all routes and views
app.use((req, res, next) => {
  // Make user available in views
  res.locals.user = req.session.user || null;
  res.locals.userRole = req.session.user ? req.session.user.role : null;
  
  // Make user available in route handlers
  req.user = req.session.user || null;
  req.userRole = req.session.user ? req.session.user.role : null;
  
  next();
});

mongoose.connect(process.env.MONGO_URI )
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/students", studentRoutes);
app.use("/admin", AdminRoutes);

app.use("/", promotonRoutes);

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render("dashboard" ,{ user: req.session.user });
});
// app.get('/', (req, res) => {
//   res.render("index");

// });
// app.js

// Add this with your other route imports
const collectionRoutes = require('./routes/collectionRoutes');

// Add this with your other middleware
app.use('/', collectionRoutes);


app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render("dashboard" ,{ user: req.session.user });
});
app.get("/", (req, res) => {
  if (req.session && req.session.user) {
    res.redirect("/dashboard"); // already logged in
  } else {
    res.redirect("/login"); // not logged in
  }
});

// Add the school info routes
const schoolInfoRoutes = require('./routes/schoolInfoRoutes');
app.use('/admin/school-info', schoolInfoRoutes);
const schoolProfile = require('./routes/schoolProfileRoutes');
app.use('/admin/school-profile', schoolProfile);
app.use("/", AdminPinRoutes);
app.use("/subjects", subjectRoutes);
app.use("/", resultRoutes);
app.use("/teachers",teacherRoutes);
app.use("/results", resultRoutes)
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);
app.use("/", CheckResult);
app.use("/", promotonRoutes);
app.listen(2000, () => console.log("Server running on http://localhost:5000"));
