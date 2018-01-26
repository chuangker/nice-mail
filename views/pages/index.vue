<template>
  <div class="nm-index">
    <sender v-model="senderVisible" @change="fetchUser"></sender>
    <docs v-model="docsVisible"></docs>
    <iframe ref="iframe"></iframe>
    <div class="editor">
      <div class="ui menu nav">
        <div class="item">
          <img src="/public/images/logo.png">
        </div>
        <a class="item" data-tab="tab-name3">主题</a>
        <a class="item" data-tab="tab-name2">配置</a>
        <a class="active item" data-tab="tab-name">正文</a>
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
          <div class="field">
            <textarea placeholder="内容" rows="30" v-model="form.content"></textarea>
          </div>
          <div class="field">
            <div class="ui fluid button" @click="genDemo">使用演示文本</div>
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
                <div class="item" :data-value="item.from" v-for="item in users" :key="item.from">{{item.alias}}({{item.from}})</div>
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
            <input type="text" :placeholder="item.name" v-model="item.value" @change="preview">
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
      senderVisible: false,
      docsVisible: false,
      notice: {
        visible: false,
        title: '',
        content: '',
        type: '',
        timer: null
      },
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
  mounted () {
    this.preview()
    this.fetch().then(() => {
      this.$nextTick(() => {
        $('.ui.dropdown').dropdown({
          allowAdditions: true
        })
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
    genDemo () {
      if (this.form.content) {
        return this.setNotice(true, '警告', '请先清空正文！', 'negative')
      }
      this.form.content = demoTxt
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
        if (this.notice.type !== 'negative') {
          this.notice.visible = false
        }
      }, 3000)
    },
    preview: debounce(function () {
      axios.post('/api/preview', this.form).then(res => {
        const body = res.data
        if (!body.success) {
          return this.setNotice(true, '错误信息', body.message, 'negative')
        }
        this.html = res.data.data.html
        this.setNotice(false)
      })
    }, 200),
    fetchUser () {
      return axios.get('/api/user').then(res => {
        this.users = res.data.data
        this.form.from = this.users[0].from
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
    send (send) {
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
      axios.post('/api/send', data).then(res => {
        const body = res.data
        if (!body.success) {
          return this.setNotice(true, '错误信息', body.message, 'negative')
        }
        this.setNotice(true, '发送成功', this.form.subject + ' 已成功发送！')
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
}
</style>
