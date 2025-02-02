const commonUtils = require("../utils/common")
const sqlUtils = require("../utils/sql")
const uuid = require("uuid")
const Queue = require("bee-queue")
const request = require("sync-request")
const createTableQuery = `
CREATE TABLE IF NOT EXISTS 
links
(
id INT AUTO_INCREMENT,
name VARCHAR(255),
is_dangerous_info TEXT,
is_dangerous BOOLEAN,
url TEXT,
unique_id VARCHAR(255),
short_alias VARCHAR(255),
is_public BOOLEAN DEFAULT 0,
user_id INT,
FOREIGN KEY (user_id) REFERENCES users(id),
PRIMARY KEY(id),
UNIQUE KEY \`unique\` (\`unique_id\`, \`short_alias\`, \`name\`)
)
`

const isDangerousQueue = new Queue("isDangerous", {
  redis: {
    host: "redis",
  },
})

isDangerousQueue.process(async (job) => {
  const resultUrl = job.data.url
  const linkUniqueId = job.data.uniqueId
  const ms = 3000
  let status = "queued" // until completed
  let tries = 0
  while (status !== "completed") {
    const resultResponse = request("GET", resultUrl, {
      headers: { "x-apikey": global.virusTotalAPIKey },
    }).body.toString()
    const resultResponseJson = JSON.parse(resultResponse)
    tries += 1

    status = resultResponseJson.data.attributes.status
    if (status !== "completed") {
      global.db.query(
        `
      UPDATE links SET is_dangerous_info = ? WHERE unique_id=?; 
      `.trim(),
        [`QUEUED (${tries} probes)`, linkUniqueId],
      )

      await commonUtils.sleep(ms)
      continue
    }
    const is_dangerous =
      resultResponseJson.data.attributes.stats.malicious !== 0
    const info = is_dangerous ? "Detected as malicious" : "OK"
    global.db.query(
      `
    UPDATE links SET is_dangerous = ?, is_dangerous_info = ? WHERE unique_id=?; 
    `.trim(),
      [is_dangerous, info, linkUniqueId],
    )
  }
})
function byAlias(alias) {
  const results = global.db.query("SELECT * FROM links WHERE short_alias=?", [
    alias,
  ])
  if (results.length === 0) {
    return null
  }
  return results[0]
}
function byId(linkId) {
  const results = global.db.query("SELECT * FROM links WHERE id=?", [linkId])
  if (results.length === 0) {
    return null
  }
  return results[0]
}

function checkIsDangerous(url, linkUniqueId) {
  const results = global.db.query(
    "SELECT * FROM links WHERE url=? and is_dangerous_info <> ?",
    [url, "QUEUED%"],
  )
  if (results.length > 0) {
    const data = results[0]
    return {
      err: null,
      is_dangerous: data.is_dangerous,
      info: data.is_dangerous_info,
    }
  }
  const data = new request.FormData()

  data.append("url", url)
  const response = request("POST", "https://www.virustotal.com/api/v3/urls", {
    form: data,
    headers: { "x-apikey": global.virusTotalAPIKey },
  }).body.toString()
  const responseJson = JSON.parse(response)
  if (!responseJson.data || !responseJson.data.links) {
    return {
      err: "Could not communicate with Virus Total!",
      is_dangerous: null,
      info: null,
    }
  }
  const resultURL = responseJson.data.links.self
  isDangerousQueue.createJob({ url: resultURL, uniqueId: linkUniqueId }).save()
  return { err: null, is_dangerous: false, info: "QUEUED" }
}
function checkLinkExists(userId, url) {
  const data = global.db.query(
    "SELECT * FROM links WHERE user_id=? and url=?",
    [userId, url],
  )
  return data.length !== 0
}
function checkNameExists(name) {
  const data = global.db.query("SELECT * FROM links WHERE name=?", [name])
  return data.length !== 0
}

function generateAlias() {
  let count = sqlUtils.count("links")
  if (!Number.isInteger(count) || count < 0) {
    count = 0
  }
  let aliasLength = 2
  while (commonUtils.randomStringChars.length ** aliasLength * 0.3 < count) {
    ++aliasLength
  }
  let isAliasOK = null
  let alias = null
  while (isAliasOK !== true) {
    alias = commonUtils.randomString(aliasLength)
    const countKey = "COUNT(*)"
    const result = global.db.query(
      `SELECT ${countKey} FROM links WHERE short_alias=?`,
      [alias],
    )
    const aliasCount = result[0][countKey]
    isAliasOK = aliasCount === 0
  }
  return alias
}
function setPublicStatus(userId, linkId, isPublic) {
  if (
    !Number.isInteger(userId) ||
    !userId < 0 ||
    !Number.isInteger(linkId) ||
    !linkId < 0
  ) {
    return { err: "bad ids" }
  }
  const link = sqlUtils.byId("links", linkId)
  if (link === null) {
    return { err: "link does not exist" }
  }
  if (link.user_id !== userId) {
    return { err: "this link does not belong to this user" }
  }
  const isPublicValue = isPublic ? 1 : 0
  const result = global.db.query(
    "UPDATE links SET is_public = ? WHERE id = ?",
    [isPublicValue, linkId],
  )
  if (result.affectedRows === 0) {
    return { err: "data corrupted!" }
  }
  let err = result.changedRows > 0 ? null : "database operation failed"
  if (result.affectedRows > 0) {
    err = null
  }
  return { err }
}
function makePublic(userId, linkId) {
  return setPublicStatus(userId, linkId, true)
}
function makePrivate(userId, linkId) {
  return setPublicStatus(userId, linkId, false)
}
function getPublicLinks() {
  return global.db.query(
    "SELECT * FROM links WHERE is_public=1 and is_dangerous=0",
  )
}
function hasPermission(link, user) {
  if (!link) {
    return false
  }
  if (!user) {
    return !!link.is_public
  } else {
    console.log(user)
    return link.user_id === user.id
  }
}
function search(keywords, userId) {
  const results1 = global.db.query(
    "SELECT * FROM links WHERE is_public=1 and is_dangerous=0 and name LIKE ?",
    [`%${keywords}%`],
  )
  const results2 = global.db.query(
    "SELECT * FROM links WHERE is_public=1 and is_dangerous=0 and url LIKE ?",
    [`%${keywords}%`],
  )

  if (!userId) {
    return commonUtils.union("id", results1, results2)
  }
  const results3 = global.db.query(
    "SELECT * FROM links WHERE user_id=? and name LIKE ?",
    [userId, `%${keywords}%`],
  )
  const results4 = global.db.query(
    "SELECT * FROM links WHERE user_id=? and url LIKE ?",
    [userId, `%${keywords}%`],
  )
  return commonUtils.union("id", results1, results2, results3, results4)
}
function deleteLink(userId, linkId) {
  const results = global.db.query("SELECT * FROM links WHERE id=?", [linkId])
  if (results.length === 0) {
    return { err: "link does not exist" }
  }
  const link = results[0]
  if (link.user_id !== userId) {
    return { err: "link does not belong to this user" }
  }
  const result = global.db.query("DELETE FROM links WHERE id=?", [linkId])
  if (result.affectedRows < 1) {
    return { err: "database operation failed" }
  }
  return { err: null }
}

function createLink(userId, name, rawURL, alias) {
  if (!commonUtils.isString(name) || !commonUtils.isString(rawURL)) {
    return { id: null, err: "bad name or url" }
  }
  const url = rawURL.trim()
  name = name.trim()
  if (name.length < 1) {
    return { id: null, err: "blank name" }
  }
  if (checkNameExists(name)) {
    return { id: null, err: "link name exists" }
  }
  if (!commonUtils.isValidUrl(url)) {
    return { id: null, err: "invalid url" }
  }
  if (!commonUtils.isString(url) || !Number.isInteger(userId)) {
    return { id: null, err: "bad parameters" }
  }
  if (checkLinkExists(userId, url)) {
    return { id: null, err: "link exists" }
  }
  const userModel = global.models.user
  if (!userModel.checkIdExists(userId)) {
    return { id: null, err: "invalid user id" }
  }

  const uniqueId = uuid.v4()
  const { err, is_dangerous, info } = checkIsDangerous(url, uniqueId)
  const is_dangerous_info = info
  if (err !== null) {
    return { id: null, err }
  }
  const shortAlias = alias ? alias : generateAlias()
  const readableQuery = `INSERT INTO 
  links
  (name,url,is_dangerous,is_dangerous_info,unique_id,short_alias,user_id)
  VALUES
  (?,   ?,  ?,           ?,                ?,        ?,           ?);`
  const query = readableQuery.replace(/\n/g, " ").replace(/\s+/g, " ")
  const result = global.db.query(query, [
    name,
    url,
    is_dangerous,
    is_dangerous_info,
    uniqueId,
    shortAlias,
    userId,
  ])
  if (!result.insertId) {
    return { id: null, err: "database error" }
  }
  return { id: result.insertId, err: null }
}
function getLinksByUserId(userId) {
  const results = global.db.query("SELECT * FROM links WHERE user_id=?", [
    userId,
  ])
  if (results.length < 1) {
    return []
  }
  return results
}
module.exports = {
  createTableQuery,
  createLink,
  deleteLink,
  search,
  makePrivate,
  makePublic,
  getPublicLinks,
  byAlias,
  byId,
  getLinksByUserId,
  hasPermission,
  generateAlias,
}
