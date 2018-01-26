'use strict'

const fs = require('fs')
const path = require('path')
const isProd = process.env.NODE_ENV === 'production'

module.exports = class ViewMiddleware {
  static render (app) {
    let readyPromise = Promise.resolve()
    let renderer

    if (isProd) {
      renderer = fs.readFileSync(path.join(__dirname, '../dist/index.html'))
    } else {
      readyPromise = require('../build/dev')(app, (bundle) => {
        renderer = bundle
      })
    }

    return async function (ctx) {
      await readyPromise
      ctx.type = 'html'
      ctx.body = renderer
    }
  }
}
