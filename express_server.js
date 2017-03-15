const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

//added view engine to use ejs.
app.set("view engine", "ejs");

//Added body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//creates random 6 character string
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
generateRandomString();

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Gives page to enter URL to shorten.
app.get("/urls/new", (req, res) => {
  let website = req.params.new;
  res.render("urls_new");
});

// renders webpage for given id.
app.get("/urls/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, longURL: longURL};
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

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});