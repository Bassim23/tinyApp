const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const cookieParser = require('cookie-parser');


//added view engine to use ejs.
app.set("view engine", "ejs");

//Added body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//creates random 6 character string
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "2"
  }
}
/**
 * if user is logged in:
*  redirect -> /urls
*  if user is not logged in:
*  redirect -> /login
 */
app.get("/", (req, res) => {
  let userId = req.cookies.userId;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

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
  let user = users[req.cookies.userId];
  if (user) {
    let myUrls = findUrlsByUserId(user.id);
    console.log(myUrls);
    let templateVars = {user: user, myUrls: myUrls };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).render("error");
  }
});

//Gives page to enter URL to shorten.
app.get("/urls/new", (req, res) => {
  let userId = req.cookies.userId;
  if (userId) {
  let templateVars = {user: users[userId]};
  res.render("urls_new", templateVars);
  } else {
    res.status(401).render("error");
  }
});

// renders webpage for given id.
app.get("/urls/:id", (req, res) => {
  let userId = req.cookies.userId;
    if (!urlDatabase[req.params.id]) {
      res.status(404).send("Error 404: Short URL does not exist!");
  } else if (!userId) {
      res.status(401).render('error');
  } else if (userId !== urlDatabase[req.params.id].userID) {
      res.status(403).send("Error 403 - Forbidden: You do not have access to this page.")
  } else {
      let longURL = urlDatabase[req.params.id].longURL;
      let templateVars = {user: users[userId], shortURL: (req.params.id), longURL: longURL};
      res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  let userId = req.cookies.userId;
  if (!urlDatabase[req.params.id]) {
      res.status(404).send("Error 404: Short URL does not exist!");
  } else if (!userId) {
      res.status(401).render('error');
  } else if (userId !== urlDatabase[req.params.id].userID) {
      res.status(403).send("Error 403 - Forbidden: You do not have access to this page.")
  } else {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls/'+req.params.id);
  }
});

//generates a shortURL key with associated input website.
app.post("/urls", (req, res) => {
  let user = users[req.cookies.userId]
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

//redirects shortURL to full website.
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]){
    res.status(404).send("Error 404 - ShortURL does not exist");
  } else {
      res.redirect(urlDatabase[req.params.id].longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});


app.get ("/login", (req, res) => {
  let userId = req.cookies.userId;
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
    if (user.password === req.body.password) {
      res.cookie("userId", user.id);
      res.redirect('/')
      return;
    }
  }
  res.status(401).send("401 Error - Bad Credentials");
});

app.post("/logout", (req, res) => {
  res.clearCookie('userId');
  res.redirect('/');
});

app.get("/register", (req, res) => {
  let userId = req.cookies.userId;
    if (userId) {
      res.redirect("/");
    } else {
      res.render("register");
    }
});

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
    res.send("Error: email or password not entered");
  } else if (findExistingEmail(req.body.email)) {
    res.status(400);
    res.send("Error: email already registered");
  } else {
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    };
    console.log(users);
    res.cookie("userId", userId);
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});