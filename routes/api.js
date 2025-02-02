const commonUtils = require("../utils/common")
const apiPrefix = "/api"
const processLink = (link) => {
  const processedLink = {}
  processedLink.name = link.name
  processedLink.alias = link.short_alias
  processedLink.target = link.url
  processedLink.is_dangerous = !!link.is_dangerous
  processedLink.virus_info = link.is_dangerous_info
  processedLink.is_public = !!link.is_public
  return processedLink
}
const getRequestToken = (req, enforcedType) => {
  if (!enforcedType) {
    enforcedType = global.tokenType
  }
  if (!req) {
    return null
  }
  const authorizationHeader = req.get("Authorization")
  if (!commonUtils.isString(authorizationHeader)) {
    return null
  }
  const parts = authorizationHeader.split(" ")
  if (parts.length !== 2) {
    return null
  }
  if (parts[0] !== enforcedType) {
    return null
  }
  return parts[1]
}
const getResponse = (data, err) => {
  if (!data) {
    data = null
  }
  if (!err) {
    err = null
  }
  return { data, err }
}
const applyRoutes = (app, context) => {
  app.get(`${apiPrefix}/ping/`, function (req, res) {
    const { err } = global.models.apiToken.authenticate(getRequestToken(req))
    const isAuthenticated = err === null
    res.json(
      getResponse({
        message: "pong",
        is_authenticated: isAuthenticated,
        whoami: context.title,
      }),
    )
  })
  app.post(`${apiPrefix}/auth/get-token/`, (req, res) => {
    var { user, err } = global.models.user.authenticate(
      req.body.username,
      req.body.password,
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    var { token, err } = global.models.apiToken.create(user)
    if (err !== null) {
      res.status(400).json(getResponse(null, err))
      return
    }
    res.json(getResponse(token))
  })
  app.get(`${apiPrefix}/links/list-public/`, (req, res) => {
    const links = global.models.link.getPublicLinks()
    const processedLinks = links.map((link) => processLink(link))
    res.json(getResponse(processedLinks))
  })
  app.get(`${apiPrefix}/links/list-private/`, (req, res) => {
    const { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    const links = global.models.link.getLinksByUserId(user.id)
    res.json(getResponse(links.map((link) => processLink(link))))
  })
  app.get(`${apiPrefix}/links/list-accessible/`, (req, res) => {
    const { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    const isAuthenticated = err === null
    const publicLinks = global.models.link.getPublicLinks()
    let links = []
    if (isAuthenticated) {
      const privateLinks = global.models.link.getLinksByUserId(user.id)
      links = commonUtils.union("id", publicLinks, privateLinks)
    } else {
      links = publicLinks
    }
    res.json(getResponse(links.map((link) => processLink(link))))
  })
  app.post(`${apiPrefix}/link/make-public/:alias/`, (req, res) => {
    var { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    const alias = req.params.alias
    const link = global.models.link.byAlias(alias)
    if (link === null) {
      res.status(404).json(getResponse(null, "no such link"))
      return
    }

    var { err } = global.models.link.makePublic(user.id, link.id)
    if (err !== null) {
      res.status(400).json(getResponse(null, "database error"))
      return
    }
    res.json(getResponse(`Made ${alias} public.`))
  })
  app.post(`${apiPrefix}/link/make-private/:alias/`, (req, res) => {
    var { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    const alias = req.params.alias
    const link = global.models.link.byAlias(alias)
    if (link === null) {
      res.status(404).json(getResponse(null, "no such link"))
      return
    }
    var { err } = global.models.link.makePrivate(user.id, link.id)
    if (err !== null) {
      res.status(400).json(getResponse(null, "database error"))
      return
    }
    res.json(getResponse(`Made ${alias} private.`))
  })
  app.post(`${apiPrefix}/links/new/`, (req, res) => {
    var { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    const name = req.body.name
    const url = req.body.url
    const alias = global.models.link.generateAlias()
    var { id, err } = global.models.link.createLink(user.id, name, url, alias)
    if (err !== null || !Number.isInteger(id)) {
      res.status(400).json(getResponse(null, err))
      return
    }
    return res.json(getResponse({ alias, created: true }))
  })
  app.delete(`${apiPrefix}/link/:alias/`, (req, res) => {
    var { user, err } = global.models.apiToken.authenticate(
      getRequestToken(req),
    )
    if (err !== null) {
      res.status(401).json(getResponse(null, err))
      return
    }
    const alias = req.params.alias
    const link = global.models.link.byAlias(alias)
    if (link === null) {
      res.status(404).json(getResponse(null, "no such link"))
      return
    }
    if (global.models.link.hasPermission(link, user)) {
      var { err } = global.models.link.deleteLink(user.id, link.id)
      if (err !== null) {
        res.status(400).json(getResponse(null, err))
        return
      }
      res.json(getResponse({ deleted: true, link: processLink(link) }))
    } else {
      res.status(403).json(getResponse(null, "permission denied"))
    }
  })
  app.get(`${apiPrefix}/link/:alias/`, (req, res) => {
    const { user } = global.models.apiToken.authenticate(getRequestToken(req))
    const alias = req.params.alias
    const link = global.models.link.byAlias(alias)
    if (link === null) {
      res.status(404).json(getResponse(null, "no such link"))
    }
    if (global.models.link.hasPermission(link, user)) {
      res.json(getResponse(processLink(link)))
    } else {
      res.status(403).json(getResponse(null, "permission denied"))
    }
  })
}
module.exports = {
  applyRoutes,
}
