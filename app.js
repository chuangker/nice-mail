'use strict'

const Koa = require('koa')
const path = require('path')
const koaBody = require('koa-body')
const Router = require('koa-router')
const favicon = require('koa-favicon')
const onerror = require('koa-onerror')
const staticCache = require('koa-static-cache')

const api = require('./api')
const util = require('./util')
const middleware = require('./middlewares')

const app = module.exports = new Koa()
const router = new Router({ prefix: '/api' })

onerror(app)
util.init()

router
  .get('/user', api.getMailUser)
  .get('/version', api.checkVersion)
  .post('/user', api.addMailUser)
  .post('/user/delete', api.deleteMailUser)
  .get('/template', api.getTemplate)
  .get('/history', api.getHistory)
  .get('/history/:id', api.getHistoryContent)
  .delete('/history/:id', api.deleteHistory)
  .post('/draft', api.saveDraft)
  .post('/send', api.send)
  .post('/upload', api.upload)
  .post('/preview', api.preview)
  .post('/download/pdf', api.downloadPDF)

util.getAllTemplateConfig().forEach(conf => {
  app.use(serve('/assets/' + conf.template, path.resolve(conf.dir, conf.assets)))
})

app
  .use(favicon(path.resolve(__dirname, 'public/images/logo.png')))
  .use(serve('/dist', './dist'))
  .use(serve('/public', './public'))
  .use(serve('/upload', path.resolve(__dirname, 'config', util.getDir('upload'))))
  .use(koaBody({ multipart: true }))
  .use(middleware.util)
  .use(router.routes())
  .use(router.allowedMethods())

if (process.env.NODE_ENV !== 'test') {
  app.use(require('./middlewares/view').render(app))
}

if (!module.parent) {
  const port = util.getConfig('port')
  app.listen(port)
  console.log(`server started at http://127.0.0.1:${port}`)
}

function serve (prefix, filePath) {
  return staticCache(path.resolve(__dirname, filePath), {
    prefix: prefix,
    gzip: true,
    dynamic: true,
    maxAge: 60 * 60 * 24 * 30
  })
}
