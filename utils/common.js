const URL = require("url").URL
function isValidUrl(s) {
  if (!isString(s)) {
    return false
  }
  if (!s.startsWith("http:") && !s.startsWith("https:")) {
    return false
  }
  // https://stackoverflow.com/a/55585593
  try {
    new URL(s)
    return true
  } catch (err) {
    return false
  }
}
function isString(variable) {
  // https://stackoverflow.com/a/9436948
  return typeof variable === "string" || variable instanceof String
}
function promisify(fn) {
  // https://stackoverflow.com/a/49099604
  return function () {
    const t = this
    return new Promise(function (resolve, reject) {
      const args = Array.prototype.slice.call(arguments)
      args.push(function (err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
      fn.apply(t, args)
    })
  }
}
function sleep(ms) {
  // https://stackoverflow.com/a/39914235
  return new Promise((resolve) => setTimeout(resolve, ms))
}
const randomStringChars =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-"
function randomString(length) {
  const chars = randomStringChars
  // https://stackoverflow.com/a/10727155
  let result = ""
  for (let i = length; i > 0; --i)
    result = `${result}${chars[Math.floor(Math.random() * chars.length)]}`
  return result
}
function union(key, ...arrays) {
  const unionedArray = Array.prototype.concat(...arrays)
  const uniqueUnion = []
  for (let element of unionedArray) {
    let skip = false
    uniqueUnion.forEach((item) => {
      if (!skip && item[key] === element[key]) {
        skip = true
      }
    })
    if (skip) {
      continue
    }
    uniqueUnion.push(element)
  }
  return uniqueUnion
}
function timestamp() {
  return Number.parseInt(Date.now().toString().substring(0, 10))
}
module.exports = {
  isString,
  promisify,
  sleep,
  randomString,
  isValidUrl,
  randomStringChars,
  union,
  timestamp,
}
