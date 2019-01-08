'use strict'

const _ = require('lodash')
const path = require('path')
const axios = require('axios')
const fs = require('fs-extra')
const { URL } = require('url')
const semver = require('semver')
const crypto = require('crypto')
const moment = require('moment')
const Email = require('email-templates')
const MarkdownIt = require('markdown-it')
const mark = require('markdown-it-mark')
const insert = require('markdown-it-ins')
const katex = require('markdown-it-katex')
const emoji = require('markdown-it-emoji')
const subscript = require('markdown-it-sub')
const superscript = require('markdown-it-sup')
const deflist = require('markdown-it-deflist')
const footnote = require('markdown-it-footnote')
const abbreviation = require('markdown-it-abbr')
const tasklists = require('markdown-it-task-lists')

const util = require('../util')
const mail = require('../util/mail')
const packageJSON = require('../package.json')

const templateDir = path.resolve(__dirname, '../templates')
const uploadDir = util.getDir('upload')

const md = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true,
  linkify: true
}).use(subscript)
  .use(superscript)
  .use(footnote)
  .use(deflist)
  .use(abbreviation)
  .use(insert)
  .use(mark)
  .use(emoji)
  .use(katex, { 'throwOnError': false, 'errorColor': '#cc0000' })
  .use(tasklists, { enabled: this.taskLists })

function saveHistory ({to, cc, bcc, subject, content, mailFrom, isDraft}) {
  const historyPath = path.resolve(util.getDir('db'), 'history')
  const db = util.getDB()
  const history = db.history || []
  const draft = _.find(history, ['draft', true])
  let historyItem = isDraft ? draft : null

  if (!historyItem) {
    const hash = crypto.createHash('sha256')
      .update(_.now() + content)
      .digest('hex')

    historyItem = {
      id: hash,
      file: path.resolve(historyPath, hash + '.md'),
      draft: isDraft
    }

    if (!db.history) db.history = history
    history.unshift(historyItem)

    if (!isDraft && draft) {
      history.unshift(_.pullAt(history, 1)[0])
    }
  }

  historyItem.dateTime = moment().format('YYYY年MM月DD日 HH:mm')
  historyItem.from = mailFrom
  historyItem.to = _.filter([to, cc, bcc].join(',').split(','))
  historyItem.subject = subject

  fs.ensureDirSync(historyPath)
  fs.writeFileSync(historyItem.file, content, 'utf8')
  util.setDB(db)
}

module.exports = class ApiController {
  static async upload (ctx) {
    const origin = ctx.request.origin
    let files = ctx.request.body.files.file

    if (files && !files.length) {
      files = [files]
    }

    const list = files.map(file => {
      const reader = fs.createReadStream(file.path)
      const fileName = _.now() + _.random(_.now()) + path.extname(file.name).toLowerCase()
      const stream = fs.createWriteStream(path.resolve(uploadDir, fileName))
      reader.pipe(stream)
      return new URL(path.join('upload', fileName), origin).href
    })

    ctx.body = ctx.util.resuccess(list)
  }

  static async getTemplate (ctx) {
    const config = util.getAllTemplateConfig().map(conf => {
      return {
        name: conf.name,
        preview: conf.preview,
        fields: conf.fields
      }
    })

    ctx.body = ctx.util.resuccess(config)
  }

  static async deleteMailUser (ctx) {
    const mailFrom = ctx.request.body.from
    const conf = util.getDB()

    conf.mail = _.filter(conf.mail, item => item.from !== mailFrom)
    util.setDB(conf)
    ctx.body = ctx.util.resuccess()
  }

  static async addMailUser (ctx) {
    const { host, secure, user, pass, alias } = ctx.request.body
    const mailFrom = ctx.request.body.from
    const conf = util.getDB()

    conf.mail.push({
      alias,
      from: mailFrom,
      transport: {
        host,
        secure,
        auth: {
          user,
          pass
        }
      }
    })
    util.setDB(conf)

    ctx.body = ctx.util.resuccess()
  }

  static async getMailUser (ctx) {
    const list = util.getDB('mail')

    ctx.body = ctx.util.resuccess(list.map(mail => ({
      alias: mail.alias,
      from: mail.from
    })))
  }

  static async preview (ctx) {
    const fields = ctx.request.body.fields
    const subject = ctx.request.body.subject
    const content = ctx.request.body.content
    const template = ctx.request.body.template
    const conf = util.getConfigByName(template)

    const newFields = {}
    let html

    if (!conf) {
      ctx.body = ctx.util.refail('没有找到对应模板')
      return
    }

    if (fields) {
      fields.forEach(field => {
        newFields[field.name] = field.value
      })
    }

    const email = new Email({
      views: {
        root: templateDir
      },
      juiceResources: {
        webResources: {
          relativeTo: path.resolve(conf.dir, conf.assets),
          images: true
        }
      }
    })

    try {
      html = await email.render(path.join(conf.template, 'html'), {
        subject,
        fields: newFields,
        content: md.render(content)
      })
    } catch (error) {
      ctx.body = ctx.util.refail(error.message)
      return
    }

    ctx.body = ctx.util.resuccess({
      html: html
    })
  }

  static async send (ctx) {
    const params = {
      ...ctx.request.body.fields,
      mailFrom: ctx.request.body.fields.from,
      file: ctx.request.body.files.file
    }

    try {
      await mail.send(params)
      saveHistory(params)
    } catch (error) {
      ctx.body = ctx.util.refail(error.message)
      return
    }

    ctx.body = ctx.util.resuccess()
  }

  static async getHistory (ctx) {
    let history = util.getDB('history') || []

    history = history.map(item => {
      delete item.file
      return item
    })

    ctx.body = ctx.util.resuccess(history)
  }

  static async getHistoryContent (ctx) {
    const id = ctx.params.id
    const history = _.find(util.getDB('history'), ['id', id])
    let content = ''

    if (history) {
      content = fs.readFileSync(history.file, 'utf8')
    }

    ctx.body = ctx.util.resuccess(content)
  }

  static async saveDraft (ctx) {
    saveHistory({
      ...ctx.request.body,
      mailFrom: ctx.request.body.from,
      isDraft: true
    })
    ctx.body = ctx.util.resuccess()
  }

  static async deleteHistory (ctx) {
    const id = ctx.params.id

    const db = util.getDB()
    const history = db.history

    const items = _.remove(history, ['id', id])
    util.setDB(db)

    if (items[0]) fs.removeSync(items[0].file)

    ctx.body = ctx.util.resuccess()
  }

  static async checkVersion (ctx) {
    const localVersion = packageJSON.version
    const res = await axios.get('https://registry.npmjs.org/@chuangker%2Fnice-mail', {timeout: 5000})
    const data = {
      version: 'v' + localVersion,
      update: false
    }

    if (res.status === 200) {
      const latestVersion = res.data['dist-tags'].latest
      if (semver.lt(localVersion, latestVersion)) {
        data.version = 'v' + latestVersion
        data.update = true
      }
    }

    ctx.body = ctx.util.resuccess(data)
  }
}
