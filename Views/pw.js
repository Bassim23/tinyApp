const bcrypt = require('bcrypt');

console.log(bcrypt.hashSync("1", 10));
console.log(bcrypt.hashSync("2", 10));

