'use strict'

const fs = require('fs-extra')
const _ = require('lodash')
const path = require('path')

const templates = path.resolve(__dirname, '../templates')
const configPath = path.resolve(__dirname, '../config/default.json')

let dbPath

module.exports = class Util {
  static init () {
    dbPath = path.resolve(this.getDir('db'), 'db.json')
    if (fs.existsSync(dbPath)) return
    fs.writeFileSync(dbPath, JSON.stringify({
      mail: []
    }, null, 2))
  }
  static getDir (dirName) {
    const dir = this.getConfig(dirName)
    if (dir) {
      const fullPath = path.resolve(__dirname, '../config', dir)
      fs.ensureDirSync(fullPath)
      return fullPath
    }
  }
  static getConfig (key) {
    const conf = JSON.parse(fs.readFileSync(configPath))
    return key ? conf[key] : conf
  }
  static setConfig (conf) {
    fs.writeFileSync(configPath, JSON.stringify(conf, null, 2))
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
