'use strict'

const fs = require('fs')
const _ = require('lodash')
const path = require('path')

const dbPath = path.resolve(__dirname, '../db/db.json')
const templates = path.resolve(__dirname, '../templates')
const configPath = path.resolve(__dirname, '../config/default.json')

module.exports = class Util {
  static init () {
    const dbDir = path.resolve(dbPath, '..')
    if (fs.existsSync(dbPath)) return
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir)
    fs.writeFileSync(dbPath, JSON.stringify({
      mail: []
    }, null, 2))
  }
  static getConfig (key) {
    const conf = JSON.parse(fs.readFileSync(configPath))
    return key ? conf[key] : conf
  }
  static getDB (key) {
    const db = JSON.parse(fs.readFileSync(dbPath))
    return key ? db[key] : db
  }
  static setDB (conf) {
    fs.writeFileSync(dbPath, JSON.stringify(conf, null, 2))
  }
  static getAllTemplateConfig () {
    const dirs = fs.readdirSync(templates)
    const config = []
    dirs.forEach(dir => {
      const dirPath = path.resolve(templates, dir)
      if (fs.statSync(dirPath).isDirectory()) {
        const content = fs.readFileSync(path.resolve(dirPath, 'config.json'))
        if (content) {
          const conf = JSON.parse(content)
          conf.dir = dirPath
          conf.template = dir
          conf.preview = path.join('assets', conf.template, conf.preview)
          config.push(conf)
        }
      }
    })

    return config
  }

  static getConfigByName (name) {
    return _.find(this.getAllTemplateConfig(), ['name', name])
  }
}
