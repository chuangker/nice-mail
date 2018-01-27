'use strict'

const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const { URL } = require('url')
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
const inlineBase64 = require('nodemailer-plugin-inline-base64')

const util = require('../util')

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
    const {to, cc, bcc, send, subject, content, template, fields} = ctx.request.body.fields
    const mailFrom = ctx.request.body.fields.from
    let files = ctx.request.body.files.file

    const newFields = {}

    if (files && !files.length) {
      files = [files]
    }

    if (fields) {
      JSON.parse(fields).forEach(field => {
        newFields[field.name] = field.value
      })
    }

    const conf = util.getConfigByName(template)
    const mailConf = _.find(util.getDB('mail'), ['from', mailFrom])

    if (!mailConf) {
      ctx.body = ctx.util.refail('无发件人信息')
      return
    }

    const email = new Email({
      message: {
        from: mailFrom,
        attachments: _.map(files, file => ({
          filename: file.name,
          content: fs.createReadStream(file.path)
        }))
      },
      preview: send === 'false',
      send: send === 'true',
      transport: mailConf.transport,
      views: {
        root: templateDir
      },
      juiceResources: {
        webResources: {
          images: true,
          relativeTo: path.resolve(conf.dir, conf.assets)
        }
      }
    })

    email.config.transport.use('compile', inlineBase64())

    try {
      await email.send({
        template: conf.template,
        message: { to, cc, bcc },
        locals: {
          subject,
          content: md.render(content),
          fields: newFields
        }
      })
    } catch (error) {
      ctx.body = ctx.util.refail(error.message)
      return
    }

    ctx.body = ctx.util.resuccess()
  }
}
