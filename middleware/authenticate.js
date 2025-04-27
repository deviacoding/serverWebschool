const jwt = require('jsonwebtoken');
const SECRET = 'supersecretkey'; // idéalement à stocker dans process.env

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, SECRET);
    req.token = decoded; 
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

module.exports = authenticate;
