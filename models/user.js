const commonUtils = require("../utils/common")
const bcrypt = require("bcrypt")
const createTableQuery = `
CREATE TABLE IF NOT EXISTS 
users 
(
id INT AUTO_INCREMENT,
username TEXT,
pwhash TEXT,
PRIMARY KEY(id)
)
`
function isPasswordValid(password) {
  return commonUtils.isString(password) && password.length >= 6
}
function isUsernameValid(username) {
  return commonUtils.isString(username) && username.length > 2
}
function hashPassword(password) {
  if (commonUtils.isString(password) === false) {
    return null
  }
  return bcrypt.hashSync(password, global.saltRounds)
}
function checkUserExists(username) {
  const data = global.db.query("SELECT * FROM `users` WHERE `username` = ?", [
    username,
  ])
  return data.length !== 0
}
function checkIdExists(id) {
  const data = global.db.query("SELECT * FROM `users` WHERE `id` = ?", [id])
  return data.length !== 0
}
function getUser(username) {
  const data = global.db.query("SELECT * FROM `users` WHERE `username` = ?", [
    username,
  ])
  if (data.length === 0) {
    return null
  }
  return data[0]
}
function getUserById(id) {
  const data = global.db.query("SELECT * FROM `users` WHERE `id` = ?", [id])
  if (data.length === 0) {
    return null
  }
  return data[0]
}

function getUser(username) {
  const data = global.db.query("SELECT * FROM `users` WHERE `username` = ?", [
    username,
  ])
  if (data.length === 0) {
    return null
  }
  return data[0]
}
function createUser(username, password) {
  if (isUsernameValid(username) === false) {
    return { id: null, err: "invalid username" }
  }
  if (isPasswordValid(password) === false) {
    return { id: null, err: "weak password or invalid password" }
  }
  if (checkUserExists(username) === true) {
    return { id: null, err: "username exists" }
  }
  const pwhash = hashPassword(password)
  if (pwhash === null) {
    return { id: null, err: "could not process password" }
  }
  const result = global.db.query(
    "INSERT INTO users(username, pwhash) VALUES (?, ?)",
    [username, pwhash],
  )
  return { id: result.insertId, err: null }
}
function checkPassword(password, hash) {
  if (!(commonUtils.isString(password) && commonUtils.isString(hash))) {
    return false
  }
  return bcrypt.compareSync(password, hash)
}
function authenticate(username, password) {
  if (!commonUtils.isString(username) || !commonUtils.isString(password)) {
    return { user: null, err: "bad username or password format" }
  }
  const user = getUser(username)
  if (user === null) {
    return { user: null, err: "invalid credentials" }
  }
  const passwordOk = checkPassword(password, user.pwhash)
  if (!passwordOk) {
    return { user: null, err: "invalid credentials" }
  }
  return { user, err: null }
}
module.exports = {
  createTableQuery,
  createUser,
  getUser,
  checkUserExists,
  authenticate,
  checkIdExists,
  getUserById,
}
