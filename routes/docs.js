const commonUtils = require("../utils/common")
const domUtils = require("../utils/dom")
const fs = require("fs")
const docsPrefix = "/docs"
const getFullContext = (req, docFile, context) => {
  let docContent = loadDocContent(docFile)
  return { extra: { docContent, doc: true }, context, session: req.session }
}
const loadDocContent = (docFile) => {
  if (!commonUtils.isString(docFile)) {
    return null
  }
  const availableFiles = fs.readdirSync(global.docsDir)
  if (availableFiles.indexOf(docFile) === -1) {
    return null
  }
  const path = `${global.docsDir}/${docFile}`
  const rawMarkdown = fs.readFileSync(path).toString()
  // https://github.com/markedjs/marked/issues/2139
  const markdown = rawMarkdown.replace(
    /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,
    "",
  )
  return domUtils.renderMarkdownSafe(markdown)
}
const applyRoutes = (app, context) => {
  app.get(`${docsPrefix}/`, function (req, res) {
    const docFile = "index.md"
    res.render("docs.ejs", getFullContext(req, docFile, context))
  })
  app.get(`${docsPrefix}/:docname/`, function (req, res) {
    const docname = req.params.docname
    const docFile = `${docname}.md`
    res.render("docs.ejs", getFullContext(req, docFile, context))
  })
}
module.exports = {
  applyRoutes,
  loadDocContent,
}
