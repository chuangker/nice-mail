'use strict'

const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
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

function send (opts) {
  const {
    to, cc, bcc, send, subject, content,
    template, fields, mailFrom
  } = opts
  let files = opts.file

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
    return Promise.reject(new Error('无发件人信息'))
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

  return email.send({
    template: conf.template,
    message: { to, cc, bcc },
    locals: {
      subject,
      content: md.render(content),
      fields: newFields
    }
  })
}

module.exports = {
  send: send
}
