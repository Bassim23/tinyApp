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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
/**
 * if user is logged in:
*  redirect -> /urls
*  if user is not logged in:
*  redirect -> /login
 */
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Gives page to enter URL to shorten.
app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.cookies["username"]};
  let website = req.params.new;
  res.render("urls_new", templateVars);
});

// renders webpage for given id.
app.get("/urls/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  let templateVars = {username: req.cookies["username"], shortURL: req.params.id, longURL: longURL};
  res.render("urls_show", templateVars);
});

//generates a shortURL key with associated input website.
app.post("/urls", (req, res) => {
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls/' + key);
});

//redirects shortURL to full website.
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
// return (users.filter(function(user) {return user.email === email;}).length > 0)
  function findExistingEmail(email) {
    for (let userId in users) {
      if (users[userId].email === email) {
        return true;
      }
    }
    return null;
  }
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
    res.cookie(userId, req.body.email);   // JH thinks this isn't optimal
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});