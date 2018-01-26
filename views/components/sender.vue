<template>
  <div class="sender">
    <div class="ui modal tiny sender-modal">
      <div class="header">
        发件人管理
      </div>
      <div class="content scrolling">
        <div class="ui two item menu mail-from-user">
          <a class="active item" data-tab="tab-list">发件人列表</a>
          <a class="item" data-tab="tab-add">添加发件人</a>
        </div>

        <div class="ui tab" data-tab="tab-list">
          <div class="ui one cards">
            <div class="card fulid" v-for="item in users" :key="item.from">
              <div class="content">
                <div class="header">{{item.alias}}</div>
                <div class="description">{{item.from}}</div>
              </div>
              <div class="extra content">
                <div class="ui two buttons">
                  <div class="ui basic red button" @click="deleteUser(item)">删除</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="ui tab" data-tab="tab-add">
          <div class="ui form">
            <div class="field">
              <input type="text" placeholder="别名" v-model="form.alias">
            </div>
            <div class="field">
              <input type="text" placeholder="发件人邮箱" v-model="form.from">
            </div>
            <div class="field">
              <input type="text" placeholder="邮件服务器" v-model="form.host">
            </div>
            <div class="field">
              <input type="text" placeholder="用户名" v-model="form.user">
            </div>
            <div class="field">
              <input type="password" placeholder="密码" v-model="form.pass">
            </div>
            <div class="inline field">
              <div class="ui checkbox">
                <input type="checkbox" v-model="form.secure">
                <label>使用 TLS (开启将使用 465 端口)</label>
              </div>
            </div>
            <div class="field">
              <button class="fluid primary ui button" @click="addUser">添加发件人</button>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="ui black button" @click="close">
          关闭
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'sender',
  props: {
    value: {}
  },
  data () {
    return {
      users: [],
      form: {
        alias: '',
        from: '',
        host: '',
        secure: false,
        user: '',
        pass: ''
      }
    }
  },
  watch: {
    value: function (val) {
      if (val) {
        $('.ui.menu.mail-from-user .item').tab('change tab', 'tab-add')
        this.fetch().then(() => {
          $('.sender-modal')
            .modal({
              closable: false
            })
            .modal('show')
        })
      } else {
        $('.sender-modal').modal('hide')
      }
    }
  },
  methods: {
    close () {
      this.$emit('input', false)
    },
    reset () {
      this.form = {
        alias: '',
        from: '',
        host: '',
        secure: false,
        user: '',
        pass: ''
      }
    },
    fetch () {
      return axios.get('/api/user').then(res => {
        this.users = res.data.data
      })
    },
    addUser () {
      axios.post('/api/user', this.form).then(res => {
        if (res.data.success) {
          $('.ui.menu.mail-from-user .item').tab('change tab', 'tab-list')
          this.fetch()
          this.reset()
          this.$emit('change')
        }
      })
    },
    deleteUser (user) {
      axios.post('/api/user/delete', user).then(res => {
        if (res.data.success) {
          $('.ui.menu.mail-from-user .item').tab('change tab', 'tab-list')
          this.fetch()
          this.$emit('change')
        }
      })
    }
  }
}
</script>
