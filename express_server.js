const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

//added view engine to use ejs.
app.set("view engine", "ejs");

//Added body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'development']
}));

//creates random 6 character string used in creating userID.
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//URL Databse pre-set with test variables.
const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

//User database preset with test accounts.
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$iZw8NNUO0MOusc96mHu19eWFphfe.//fHDOO73JqswXVE8cbpi5f6"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$PlJFjHhRgr4pBaL8dqr6ceTs3tW4q8XBTD3sgaThHOCHeMeVpPswO"
  }
};
/**
 * if user is logged in:
*  redirect -> /urls
*  if user is not logged in:
*  redirect -> /login
 */
app.get("/", (req, res) => {
  let userId = req.session.userId;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//function to find URL Database for a given user.
function findUrlsByUserId (userID) {
  let userURLS = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLS[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURLS;
}

app.get("/urls", (req, res) => {
  let user = users[req.session.userId];
  if (user) {
    let myUrls = findUrlsByUserId(user.id);
    let templateVars = {user: user, myUrls: myUrls };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).render("error");
  }
});

//generates a shortURL key with associated input website.
app.post("/urls", (req, res) => {
  let user = users[req.session.userId];
  if (user) {
    let key = generateRandomString();
    urlDatabase[key] = {
      "shortURL": key,
      "longURL": req.body.longURL,
      "userID": user.id
    };
    res.redirect('/urls/' + key);
  } else {
    res.status(401).render('error');
  }
});

//Gives page to enter URL to shorten.
app.get("/urls/new", (req, res) => {
  let userId = req.session.userId;
  if (userId) {
    let templateVars = {user: users[userId]};
    res.render("urls_new", templateVars);
  } else {
    res.status(401).render("error");
  }
});

// renders webpage for given id.
app.get("/urls/:id", (req, res) => {
  let userId = req.session.userId;
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Error 404: Short URL does not exist!");
  } else if (!userId) {
    res.status(401).render('error');
  } else if (userId !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Error 403 - Forbidden: You do not have access to this page.");
  } else {
    let longURL = urlDatabase[req.params.id].longURL;
    let templateVars = {user: users[userId], shortURL: (req.params.id), longURL: longURL};
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  let userId = req.session.userId;
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Error 404: Short URL does not exist!");
  } else if (!userId) {
    res.status(401).render('error');
  } else if (userId !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Error 403 - Forbidden: You do not have access to this page.");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls/' + req.params.id);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});


//redirects shortURL to full website.
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]){
    res.status(404).send("Error 404 - ShortURL does not exist");
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});


//-----------Login/Logout-----------
app.get("/login", (req, res) => {
  let userId = req.session.userId;
  if (userId) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

app.post("/login", (req, res) => {
  let user;
  for (let userId in users) {
    if (users[userId].email === req.body.email) {
      user = users[userId];
      break;
    }
  }
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.userId = user.id;
      res.redirect('/');
      return;
    }
  }
  res.status(401).send("401 Error - Bad Credentials");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// -----------Registration-----------
app.get("/register", (req, res) => {
  let userId = req.session.userId;
  if (userId) {
    res.redirect("/");
  } else {
    res.render("register");
  }
});

//Function used to find existing email for registration purposes.
function findExistingEmail(email) {
  for (let userId in users) {
    if (users[userId].email === email) {
      return true;
    }
  }
  return null;
}

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Error 400: email or password not entered");
  } else if (findExistingEmail(req.body.email)) {
    res.status(400);
    res.send("Error 400: email already registered");
  } else {
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userId = userId;
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});