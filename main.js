/*
Linky mini APP for Databases and the Web
Author: Zhao Wang
 */
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mysql = require("sync-mysql")
const expressSession = require("express-session")
const app = express()
const LinkySecret = process.env.SESSION_SECRET || "not-set"
const session = {
  secret: LinkySecret,
  cookie: {},
}
if ((process.env.DEBUG || "yes") === "no") {
  app.set("trust proxy", 1) // trust first proxy
  session.cookie.secure = true // serve secure cookies
}
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressSession(session))
app.use(express.json())
const staticDir = process.env.PWD + "/public"
console.log(`Static Dir: ${staticDir}`)
// Set up css
app.use(express.static(staticDir))
global.docsDir = process.env.PWD + "/docs"
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  multipleStatements: true,
}
console.log("Database configuration:")
console.log(dbConfig)
const db = new mysql(dbConfig)
global.db = db
global.virusTotalAPIKey = process.env.VIRUS_TOTAL_API_KEY || "not-set"
global.saltRounds = 10
const userModel = require("./models/user")
const linkModel = require("./models/link")
const apiTokenModel = require("./models/api_token")
global.tokenType = "Token"
global.models = {
  user: userModel,
  link: linkModel,
  apiToken: apiTokenModel,
}
const createTableQueries = [
  userModel.createTableQuery,
  linkModel.createTableQuery,
  apiTokenModel.createTableQuery,
]
for (const query of createTableQueries) {
  console.log(db.query(query))
}
const viewsDir = process.env.PWD + "/views"
// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set("views", viewsDir)

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs")

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine("html", ejs.renderFile)
const context = { title: "Linky Web Service" }
require("./routes/api").applyRoutes(app, context)
require("./routes/main").applyRoutes(app, context)
require("./routes/docs").applyRoutes(app, context)

const port = 8000
const host = process.env.DOCKER ? "0.0.0.0" : "127.0.0.1"
const listeningAt = process.env.DOCKER ? "Docker" : `${host}:${port}`
// Start the web app listening
app.listen(port, host, () => console.log(`listening at ${listeningAt}!`))
