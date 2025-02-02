const uuid = require("uuid")
const commonUtils = require("../utils/common")
const createTableQuery = `
CREATE TABLE IF NOT EXISTS 
tokens
(
id INT AUTO_INCREMENT,
value TEXT,
user_id INT,
valid_until BIGINT,
FOREIGN KEY (user_id) REFERENCES users(id),
PRIMARY KEY(id)
)
`
function cleanUp() {
  const now = commonUtils.timestamp()
  global.db.query("DELETE FROM tokens WHERE valid_until<?", [now])
}
function authenticate(token) {
  if (!commonUtils.isString(token)) {
    return { user: null, err: "invalid token" }
  }
  const results = global.db.query("SELECT * FROM tokens WHERE value=?", [token])
  if (results.length === 0) {
    return { user: null, err: "invalid token" }
  }
  const now = commonUtils.timestamp()
  if (now > results[0].valid_until) {
    return { user: null, err: "token expired" }
  }
  const userId = results[0].user_id
  const user = global.models.user.getUserById(userId)
  if (user === null) {
    return { user: null, err: "could not fetch user" }
  }
  return { user, err: null }
}
function create(user) {
  if (!user || !Number.isInteger(user.id)) {
    return { token: null, err: "invalid user" }
  }
  const validUntil = commonUtils.timestamp() + 3 * 24 * 3600 // 3 days
  const userId = user.id
  const token = uuid.v4()
  result = global.db.query(
    `
    INSERT INTO tokens(value, user_id, valid_until) VALUES (?, ?, ?)
    `.trim(),
    [token, userId, validUntil],
  )
  err = Number.isInteger(result.insertId) ? null : "database error"
  return { token, err }
}
module.exports = {
  createTableQuery,
  create,
  authenticate,
  cleanUp,
}
