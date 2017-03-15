var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

//creates random 6 character string
function generateRandomString() {
  var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 6; i++ ){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    };
    console.log(text);
    return text;
}
generateRandomString();

app.set("view engine", "ejs")

//Added body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
console.log(urlDatabase);
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

app.get("/urls/new", (req, res) => {
  let website = req.params.new
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id]
  let templateVars = { shortURL: req.params.id, longURL: longURL};
  res.render("urls_show", templateVars);
});

//generates a shortURL key with associated input website.
app.post("/urls", (req, res) => {
  let key = generateRandomString(); //.push(urlDatabase[req.params.id]);   // debug statement to see POST parameters
  urlDatabase[key] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('http://localhost:8080/urls/'+key);         // Respond with 'Ok' (we will replace this)
});

//redirects shortURL to full website.
app.get("/u/:shortURL", (req, res) => {

  res.redirect(urlDatabase[req.params.shortURL]);

});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});