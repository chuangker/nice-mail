import Vue from 'vue'

import './lib/semantic-ui/semantic.min'
import './lib/semantic-ui/semantic.min.css'
import './styles/index.css'
import router from './router'
import App from './components/app'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
