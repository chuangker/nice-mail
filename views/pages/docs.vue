<template>
  <div class="document">
    <div class="ui modal longer document-modal">
      <div class="header">
        使用文档
      </div>
      <div class="content scrolling markdown-body">
        <docs></docs>
      </div>
      <div class="actions">
        <div class="ui black deny button" @click="close">
          确定
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import docs from './document.md'

export default {
  name: 'document',
  props: {
    value: {}
  },
  components: {
    docs
  },
  watch: {
    value: function (val) {
      if (val) {
        $('.document-modal')
          .modal({
            closable: false
          })
          .modal('show')
      } else {
        $('.document-modal').modal('hide')
      }
    }
  },
  methods: {
    close () {
      this.$emit('input', false)
    }
  }
}
</script>

