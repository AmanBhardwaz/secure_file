const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieSession = require("cookie-session");
const path = require("path");

const app = express();

// === Google OAuth credentials ===
const CLIENT_ID =
  "628063343288-g4837n3gv99o9c58t08npqiscep2us88.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5000/callback";

// === Cookie Session Middleware ===
app.use(
  cookieSession({
    name: "session",
    keys: ["randomkey123"], // replace with strong secret key
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })
);

// === Patch for cookie-session (so Passport works fine) ===
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = cb => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = cb => cb();
  }
  next();
});

// === Initialize Passport ===
app.use(passport.initialize());
app.use(passport.session());

// === Google OAuth Strategy ===
passport.use(
  new GoogleStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: REDIRECT_URI,
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// === Serve Frontend ===
app.use(express.static(path.join(__dirname, "public")));

// === Routes ===

// Start Google login
app.get("/login", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback after Google login
app.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard.html"); // redirect to frontend profile page
  }
);

// API to get logged-in user
app.get("/api/user", (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    name: req.user.displayName,
    email: req.user.emails[0].value,
    photo: req.user.photos[0].value,
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// === Start Server ===
app.listen(5000, () => console.log("✅ Server running at http://localhost:5000"));
