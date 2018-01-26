'use strict'

const path = require('path')
const webpack = require('webpack')
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware')

const webpackConf = require('./webpack.dev.conf')

const readFile = (fs, file) => {
  try {
    return fs.readFileSync(path.join(webpackConf.output.path, file), 'utf-8')
  } catch (e) {}
}

module.exports = function setupDevServer (app, cb) {
  let resolve
  const readyPromise = new Promise(r => { resolve = r }) // eslint-disable-line
  const ready = (...args) => {
    resolve()
    cb(...args) // eslint-disable-line
  }

  const clientCompiler = webpack(webpackConf)
  const devMidd = devMiddleware(clientCompiler, {
    publicPath: webpackConf.output.publicPath,
    noInfo: true
  })
  app.use(devMidd)
  clientCompiler.plugin('done', stats => {
    stats = stats.toJson()
    stats.errors.forEach(err => console.error(err))
    stats.warnings.forEach(err => console.warn(err))
    if (stats.errors.length) return
    ready(readFile(devMidd.fileSystem, 'index.html'))
  })
  app.use(hotMiddleware(clientCompiler), { heartbeat: 5000 })
  return readyPromise
}
