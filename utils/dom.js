const marked = require("marked")
// https://github.com/cure53/DOMPurify
const createDOMPurify = require("dompurify")
const { JSDOM } = require("jsdom")

function renderMarkdownSafe(md) {
  const window = new JSDOM("").window
  const DOMPurify = createDOMPurify(window)
  const rawHTML = marked.parse(
    // https://github.com/markedjs/marked/issues/2139
    md.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""),
  )
  return DOMPurify.sanitize(rawHTML)
}
module.exports = {
  renderMarkdownSafe,
}
