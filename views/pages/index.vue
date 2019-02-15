<template>
  <div class="nm-index">
    <sender v-model="senderVisible" @change="fetchUser"></sender>
    <docs v-model="docsVisible"></docs>
    <iframe ref="iframe"></iframe>
    <div class="editor">
      <div class="ui positive message" v-if="latestVersion">
        <i class="close icon" @click="latestVersion = ''"></i>
        <div class="header">Nice Mail 升级提醒</div>
        <p>
          <a href="https://www.npmjs.com/package/@chuangker/nice-mail" target="_blank">{{latestVersion}}</a>
          已发布 (建议升级以获得更好体验), 详情见<a href="https://github.com/chuangker/nice-mail/releases" target="_blank">更新日志</a>。
        </p>
      </div>

      <div class="ui menu nav">
        <div class="item">
          <img src="/public/images/logo.png">
        </div>
        <a class="item" data-tab="tab-name3">主题</a>
        <a class="item" data-tab="tab-name2">配置</a>
        <a class="active item" data-tab="tab-name">正文</a>
        <a class="item" @click="mdToPdf">转 PDF</a>
        <div class="menu right">
          <div class="item">
            <div class="ui positive button" @click="send(true)">发送</div>
          </div>
          <div class="ui dropdown item icon"><i class="setting icon"></i>
            <div class="menu">
              <div class="item" @click="send(false)">预览邮件</div>
              <div class="item" @click="senderVisible = true">发件人配置</div>
              <div class="item" @click="docsVisible = true">使用文档</div>
              <a class="item" href="https://github.com/chuangker/nice-mail" target="_blank">GitHub</a>
              <a class="item" href="https://www.webpagefx.com/tools/emoji-cheat-sheet/" target="_blank">Emoji</a>
            </div>
          </div>
        </div>
      </div>

      <div class="ui message" v-show="notice.visible" :class="notice.type">
        <i class="close icon" @click="notice.visible = false"></i>
        <div class="header">{{notice.title}}</div>
        <p>{{notice.content}}</p>
      </div>

      <div class="ui tab" data-tab="tab-name">
        <div class="ui form">
          <div class="ui active inverted dimmer" v-if="isSend">
            <div class="ui text loader">发送中</div>
          </div>
          <div class="field">
            <textarea ref="editor" :disabled="isSend" placeholder="内容" rows="30" v-model="form.content"></textarea>
          </div>
          <div class="field">
            <div class="ui two buttons">
                <div class="ui button" @click="setMailContent()">使用演示文本</div>
                <div class="ui button secondary" @click="saveDraft">保存草稿</div>
            </div>
            <h4 class="ui horizontal divider header">历史邮件（{{history.length}}）</h4>
            <div class="ui cards">
              <div class="ui fluid card" v-for="item in history" :key="item.id">
                <div class="content">
                  <div class="right floated ui label" v-if="item.draft">草稿</div>
                  <div class="header" v-if="item.subject">{{item.subject}}</div>
                  <div class="header" v-else>无主题</div>
                  <div class="meta">{{item.dateTime}}</div>
                </div>
                <div class="content">
                  <h4 class="ui sub header" v-if="item.from">{{item.from}}</h4>
                  <h4 class="ui sub header" v-else>无发件人</h4>
                  <div class="ui small feed">
                    <div class="event">
                      <div class="content">
                        <div class="summary mail-to" v-if="item.to && item.to.length">
                          <a v-for="(t, index) in item.to" :key="index">{{t}}</a>
                        </div>
                        <div class="summary mail-to" v-else>无收件人</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="extra content">
                  <div class="ui two buttons">
                    <div class="ui basic green button" @click="getHistory(item.id)">预览</div>
                    <div class="ui basic red button" @click="deleteHistory(item.id)">删除</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ui tab" data-tab="tab-name2">
        <div class="ui form">
          <div class="field">
            <div class="ui fluid multiple search selection dropdown">
              <input type="hidden" :value="form.to" @change="form.to = $event.target.value">
              <div class="default text">收件人</div>
            </div>
          </div>
          <div class="field">
            <div class="ui fluid multiple search selection dropdown">
              <input type="hidden" :value="form.cc" @change="form.cc = $event.target.value">
              <div class="default text">抄送</div>
            </div>
          </div>
          <div class="field">
            <input type="text" placeholder="主题" v-model="form.subject">
          </div>
          <div class="field">
            <div class="ui selection dropdown">
              <input type="hidden" name="gender" v-model="form.from">
              <i class="dropdown icon"></i>
              <div class="default text">选择发件人</div>
              <div class="menu">
                <div class="item" :data-value="item.from" v-for="item in users" :key="item.from" @click="selectUser(item.from)">{{item.alias}}({{item.from}})</div>
              </div>
            </div>
          </div>
          <div class="field">
            <label>附件</label>
            <input type="file" multiple @change="onFileChange">
          </div>
          <div class="field">
            <div class="ui fluid multiple search selection dropdown">
              <input type="hidden" :value="form.bcc" @change="form.bcc = $event.target.value">
              <div class="default text">密送</div>
            </div>
          </div>

          <div class="field" v-for="(item, index) in form.fields" :key="index">
            <textarea :placeholder="item.name" rows="5" v-model="item.value" @change="preview"></textarea>
          </div>
        </div>
      </div>

      <div class="ui tab" data-tab="tab-name3">
        <div class="ui two column grid">
          <div class="column" v-for="item in templates" :key="item.name">
            <div class="ui fluid card">
              <div class="image">
                <img :src="item.preview">
              </div>
              <div class="content">
                <p class="header centerd">{{item.name}}</p>
                <button class="fluid ui button"
                  :class="{
                    green: item.name === form.template,
                    basic: item.name !== form.template
                  }"
                  :disabled="item.name === form.template"
                  @click="form.template = item.name">{{ item.name === form.template ? '使用中' : '使用模板' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import demoTxt from './demo.txt'
import resumeTxt from './resume.txt'
import docs from './docs'
import sender from '../components/sender'

export default {
  name: 'index',
  components: {
    sender,
    docs
  },
  data () {
    return {
      users: [],
      templates: [],
      html: '',
      isSend: false,
      senderVisible: false,
      docsVisible: false,
      notice: {
        visible: false,
        title: '',
        content: '',
        type: '',
        timer: null
      },
      latestVersion: '',
      history: [],
      files: [],
      form: {
        template: '',
        from: '',
        to: '',
        cc: '',
        bcc: '',
        subject: 'Nice Mail',
        content: '',
        fields: null
      }
    }
  },
  computed: {
    editor () {
      return this.$refs.editor
    }
  },
  mounted () {
    this.checkVersion()
    this.bindDrop()
    this.fetch().then(() => {
      this.preview()
      this.getHistory()
      this.$nextTick(() => {
        $('.ui.dropdown').dropdown({
          allowAdditions: true
        })
        if (this.form.template.match(/resume/i)) this.setMailContent()
      })
    })
    $('.message.warning').transition('fade')
    $('.ui.menu.nav .item').tab('change tab', 'tab-name')
  },
  watch: {
    html: function (val) {
      const doc = this.$refs.iframe.contentWindow.document
      doc.designMode = 'on'
      doc.open()
      doc.write(val)
      doc.close()
      doc.designMode = 'off'
    },
    'form.subject': function () {
      this.preview()
    },
    'form.content': function () {
      this.preview()
    },
    'form.template': function () {
      this.preview()
      this.setFields()
    }
  },
  methods: {
    mdToPdf () {
      axios.post('/api/pdf', { html: this.html }).then((res) => {
        let buffers = res.data.data.buffers
        let blod = new Blob([new Uint8Array(buffers.data).buffer])
        let url = window.URL.createObjectURL(blod)
        const link = document.createElement('a')
        link.href = url
        link.download = 'email.pdf'
        link.click()
      })
    },
    checkVersion () {
      axios.get('/api/version').then((res) => {
        const body = res.data
        if (body.success && body.data.update) {
          this.latestVersion = body.data.version
        }
      })
    },
    selectUser (user) {
      this.form.from = user
    },
    bindDrop () {
      this.editor.ondragleave = (e) => e.preventDefault()
      this.editor.ondragenter = (e) => e.preventDefault()
      this.editor.ondragover = (e) => e.preventDefault()
      this.editor.ondrop = (e) => {
        e.preventDefault()

        const data = e.dataTransfer.files
        const formData = new FormData()

        if (data.length < 1) return

        for (let i = 0; i < data.length; i++) {
          formData.append('file', data[i], data[i].name)
        }

        this.uploadImage(formData)
      }
    },
    uploadImage (formData) {
      axios.post('/api/upload', formData).then(res => {
        const body = res.data
        if (body.success) {
          this.setNotice(true, '上传成功', '图片已成功上传！')
          this.updateContentByCursor(body.data.map(img => {
            return `![Image](${img})`
          }).join(' '))
        }
      })
    },
    updateContentByCursor (content) {
      const rangeStart = this.editor.selectionStart
      const rangeEnd = this.editor.selectionEnd
      const tempStr1 = this.editor.value.substring(0, rangeStart)
      const tempStr2 = this.editor.value.substring(rangeEnd)
      this.form.content = tempStr1 + content + tempStr2
    },
    setMailContent (content) {
      if (this.form.content) {
        return this.setNotice(true, '警告', '请先清空正文！', 'negative')
      }
      this.form.content = content || (this.form.template.match(/resume/i) ? resumeTxt : demoTxt)
    },
    onFileChange (e) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      this.files = files
    },
    setFields () {
      const conf = find(this.templates, ['name', this.form.template])
      if (conf && conf.fields) {
        this.form.fields = conf.fields
      } else {
        this.form.fields = []
      }
    },
    setNotice (visible, title, content, type) {
      clearTimeout(this.notice.timer)
      this.notice.visible = visible
      this.notice.title = title
      this.notice.content = content
      this.notice.type = type || 'success'
      this.notice.timer = setTimeout(() => {
        this.notice.visible = false
      }, 3000)
    },
    preview: debounce(function () {
      axios.post('/api/preview', this.form).then(res => {
        const body = res.data
        if (!body.success) {
          return this.setNotice(true, '错误信息', body.message, 'negative')
        }
        this.html = res.data.data.html
      })
    }, 200),
    fetchUser () {
      return axios.get('/api/user').then(res => {
        const body = res.data
        if (body.data.length) {
          this.users = res.data.data
          this.form.from = this.users[0].from
        }
        return res
      })
    },
    fetch () {
      return Promise.all([
        axios.get('/api/template'),
        this.fetchUser()
      ]).then(result => {
        this.templates = result[0].data.data
        this.form.template = this.templates[0].name
      })
    },
    getHistory (id) {
      if (id) {
        axios.get('/api/history/' + id).then(res => {
          const body = res.data
          if (body.success) {
            this.setMailContent(body.data)
          }
        })
      } else {
        axios.get('/api/history', this.form).then(res => {
          const body = res.data
          if (body.success) {
            this.history = body.data
          }
        })
      }
    },
    deleteHistory (id) {
      return axios.delete('/api/history/' + id).then(res => {
        const body = res.data
        if (body.success) {
          this.getHistory()
        }
      })
    },
    saveDraft () {
      axios.post('/api/draft', this.form).then(res => {
        const body = res.data
        if (body.success) {
          this.getHistory()
        }
      })
    },
    send (send) {
      if (this.isSend) return
      const data = new FormData()
      Array.prototype.slice.call(this.files, 0).forEach(file => data.append('file', file))
      Object.keys(this.form).forEach(key => {
        if (typeof this.form[key] === 'object') {
          data.append(key, JSON.stringify(this.form[key]))
        } else {
          data.append(key, this.form[key])
        }
      })
      data.append('send', send)
      this.isSend = true
      axios.post('/api/send', data).then(res => {
        const body = res.data
        this.isSend = false
        if (!body.success) {
          return this.setNotice(true, '错误信息', body.message, 'negative')
        }
        this.setNotice(true, '发送成功', this.form.subject + ' 已成功发送！')
        if (this.history[0] && this.history[0].draft) {
          this.deleteHistory(this.history[0].id).then(this.getHistory)
        } else {
          this.getHistory()
        }
      }).catch(() => {
        this.isSend = false
      })
    }
  }
}
</script>

<style lang="postcss">
@c index {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;

  iframe, .editor {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
  }

  .editor {
    flex: 0 0 520px;
    padding: 20px;
    overflow-y: auto;
    border-left: 1px solid #eee;
  }

  iframe {
    border: none;
  }

  .card {
    box-shadow: 0 10px 40px 0 rgba(62,57,107,0.07), 0 2px 9px 0 rgba(62,57,107,0.06);
    border: none;

    .content {
      border: none;
    }

    .header {
      font-size: 18px;
    }
  }

  .mail-to a:not(:last-child)::after {
    display: inline;
    content: ', ';
    color: black;
    cursor: default;
  }
}
</style>
