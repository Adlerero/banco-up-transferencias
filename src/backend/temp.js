const b = require('bcrypt')
b.hash('pass123', 10).then(h => console.log(h))