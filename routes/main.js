const applyRoutes = (app, context) => {
  const getFullContext = (req, extra) => {
    if (!extra) {
      extra = {}
    }
    return { context, session: req.session, extra }
  }
  app.get("/", function (req, res) {
    req.session.views = 1
    const publicLinks = global.models.link.getPublicLinks()
    res.render("index.ejs", getFullContext(req, { publicLinks }))
  })
  app.get("/s/:alias", (req, res) => {
    const alias = req.params.alias
    const link = global.models.link.byAlias(alias)
    if (link === null) {
      res.status(404).send("404 Not Found")
      return
    }
    if (link.is_dangerous) {
      res.status(200).send("This link is dangerous!")
      return
    }
    if (
      !link.is_public &&
      (!req.session.user || req.session.user.id !== link.user_id)
    ) {
      res.status(200).send("This link is private.")
      return
    }
    res.redirect(302, link.url)
  })
  app.get("/about/", (req, res) => {
    res.render("about.ejs", getFullContext(req))
  })
  app.get("/search/", function (req, res) {
    res.render("search.ejs", getFullContext(req))
  })
  app.post("/search/", function (req, res) {
    const query = req.body.query || ""
    let userId = req.session.user ? req.session.user.id : null
    const results = global.models.link.search(query, userId)

    res.render(
      "search.ejs",
      getFullContext(req, { query, results, post: true }),
    )
  })

  app.get("/register/", function (req, res) {
    res.render("register.ejs", getFullContext(req))
  })
  app.post("/register/", (req, res) => {
    const { id, err } = global.models.user.createUser(
      req.body.username,
      req.body.password,
    )
    if (err !== null) {
      res.render("register.ejs", getFullContext(req, { message: err }))
      return
    }
    if (id === null) {
      res.render(
        "register.ejs",
        getFullContext(req, { message: "unknown error :(" }),
      )
      return
    }
    req.session.user = global.models.user.getUserById(id)
    res.render("register.ejs", getFullContext(req, { registered: true }))
  })

  app.get("/login/", function (req, res) {
    if (req.session.user) {
      res.redirect(302, "/my-links/")
      return
    }

    res.render("login.ejs", getFullContext(req))
  })

  app.post("/login/", (req, res) => {
    if (req.session.user) {
      res.redirect(302, "/my-links/")
      return
    }
    const { user, err } = global.models.user.authenticate(
      req.body.username,
      req.body.password,
    )
    if (err !== null) {
      res.render("login.ejs", getFullContext(req, { message: err }))
      return
    }
    req.session.user = user
    res.redirect(302, "/my-links/")
  })
  app.get("/logout/", (req, res) => {
    req.session.user = null
    res.redirect(302, "/")
  })
  app.get("/my-links/", (req, res) => {
    if (!req.session.user) {
      res.redirect(302, "/login/")
      return
    }
    const userId = req.session.user.id
    const myLinks = global.models.link.getLinksByUserId(userId)
    res.render("my_links.ejs", getFullContext(req, { myLinks }))
  })
  app.post("/link-make-public/", (req, res) => {
    if (!req.session.user) {
      res.redirect(302, "/login/")
      return
    }
    const linkId = Number.parseInt(req.body.id)
    const { err } = global.models.link.makePublic(req.session.user.id, linkId)
    if (err !== null) {
      res.render(
        "link_action.ejs",
        getFullContext(req, { message: err, action: "Make Public" }),
      )
      return
    }
    res.redirect(302, "/my-links/")
  })
  app.post("/link-make-private/", (req, res) => {
    if (!req.session.user) {
      res.redirect(302, "/login/")
      return
    }
    const linkId = Number.parseInt(req.body.id)
    const { err } = global.models.link.makePrivate(req.session.user.id, linkId)
    if (err !== null) {
      res.render(
        "link_action.ejs",
        getFullContext(req, { message: err, action: "Make Private" }),
      )
      return
    }
    res.redirect(302, "/my-links/")
  })

  app.post("/link/", (req, res) => {
    if (!req.session.user) {
      res.redirect(302, "/login/")
      return
    }
    const url = req.body.url
    const name = req.body.name
    const { id, err } = global.models.link.createLink(
      req.session.user.id,
      name,
      url,
    )
    if (err !== null) {
      res.render(
        "link_action.ejs",
        getFullContext(req, { message: err, action: "creation" }),
      )
      return
    }
    if (id === null) {
      res.render(
        "link_action.ejs",
        getFullContext(req, {
          message: "unknown error :(",
          action: "creation",
        }),
      )
      return
    }
    res.redirect(302, "/my-links/")
  })
  app.post("/delete-link/", (req, res) => {
    if (!req.session.user) {
      res.redirect(302, "/login/")
      return
    }
    const linkId = Number.parseInt(req.body.id)
    const { err } = global.models.link.deleteLink(req.session.user.id, linkId)
    if (err !== null) {
      res.render(
        "link_action.ejs",
        getFullContext(req, { message: err, action: "Make Private" }),
      )
      return
    }
    res.redirect(302, "/my-links/")
  })
}
module.exports = {
  applyRoutes,
}
