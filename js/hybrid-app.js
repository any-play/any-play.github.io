function async(a){return(...b)=>{var c=a(...b),d=e=>e.done?Promise.resolve(e.value):Promise.resolve(e.value).then(f=>d(c.next(f)),f=>d(c.throw(f)));try{return d(c.next())}catch(e){return Promise.reject(e)}}}

window.jsonp = uuid => result => AnyPlay.callback(uuid, JSON.stringify(result))

if (window.AnyPlay) {
  window.log = (id, ...args) => {
    let msg = `[${id}] `
    for (let arg of args) {
      msg += ' '
      msg += typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
    }
    console.info(msg)
  }
} else {
  window.log = (id, ...args) => {
    console.log(`%c ${id} `, 'background: #222; color: #bada55', ...args)
  }
}

window.groupCollapsed = (id, title, ...args) => {
  console.groupCollapsed(`%c ${id} `, 'background: #222; color: #bada55', title)
  console.log(...args)
  console.groupEnd()
}

log('init', 'hybrid-app has loaded')

window.app = {
  id: 0,

  /**
   * [plugins description]
   *
   * @type {Object}
   */

  plugins: {},
  /**
   * [postMessage description]
   *
   * @param  {[type]} plugin [description]
   * @param  {[type]} msg    [description]
   * @return {[type]}        [description]
   */
  postMessage(plugin, msg) {
    if (!app.plugins[plugin]) {
      throw new Error(`Plugin ${plugin} has not been loaded`)
    }

    return window.app.plugins[plugin].sendMessage(msg)
  },

  /**
   * [get description]
   *
   * @param  {[type]} url    [description]
   * @return {[type]}        [description]
   */
  get(url) {
    let plugin = url.split('/')[1]
    let id = app.id++
    log(`app.get [${plugin}-${id}]`, 'requesting url: ' + url)

    return app.postMessage(plugin, { action: 'dispatch', url })
    .then(response => {
      log(`app.get [${plugin}-${id}]`, 'response: ', response)
      response.plugin = plugin
      return response
    })
  },

  updateSettings(plugin, settings) {
    return app.postMessage(plugin, { action: 'updateSettings', settings })
  },

  /**
   * [remove description]
   * @param  {[type]} plugin [description]
   * @return {[type]}        [description]
   */
  delete(plugin) {
    app.plugins[plugin].iframe.remove()
    delete app.plugins[plugin]
    log('deleted', plugin + 'has been removed')
  },

  /**
   * [load description]
   *
   * @param  {[type]} code [description]
   * @return {[type]}      [description]
   */
  load(code, storage) {
    let id = app.id++
    let iframe = document.createElement('iframe')
    let mc = new MessageChannel
    let store = localStorage[storage] ? JSON.parse(localStorage[storage]) : {}

    mc.port1.onmessage = evt => {
      console.log(evt.data)
      if (evt.data.action == 'setStorage') {
        store[evt.data.key] = evt.data.value
        localStorage[storage] = JSON.stringify(store)
      }
      if (evt.data.action == 'delStorage') {
        delete store[evt.data.key]
        localStorage[storage] = JSON.stringify(store)
      }
      if (evt.data.action == 'clearStorage') {
        store = {}
        localStorage[storage] = JSON.stringify(store)
      }
    }

    function sendMessage(message) {
      return new Promise((resolve, reject) => {
        let messageChannel = new MessageChannel
        messageChannel.port1.onmessage = event => resolve(event.data)

        mc.port1.postMessage(message, [messageChannel.port2])
      })
    }

    iframe.src = '/views/sandbox.html'
    iframe.hidden = true
    iframe.sandbox = 'allow-scripts'
    iframe.referrerPolicy = 'unsafe-url'

    return new Promise(resolve => {
      iframe.onload = () => {
        iframe.contentWindow.postMessage(store, '*', [mc.port2])

        let timeoutId = null
        let timeout = new Promise(resolve => {
          timeoutId = setTimeout(() => {
            log(id, 'evaling timed out')
            log(id, 'removing iframe')
            iframe.remove()

            resolve({
              ok: false,
              data: {message: 'took to long to load the plugin'}
            })
          }, 5000)
        })

        let msg = sendMessage({ action: 'eval', code }).then(result => {
          clearTimeout(timeoutId)

          if (!result.ok) {
            log(id, 'Failed to eval script', result)
            return result
          }

          if (app.plugins[result.data.name]) {
            log(id, result.data.name + ' already exist, refuse to add new plugin')
            iframe.remove()

            return {ok: false, data: {message: 'A plugin with that name already exist'}}
          }

          app.plugins[result.data.name] = {iframe, sendMessage}
          return result
        })

        resolve(Promise.race([timeout, msg]))
      }
      iframe.onerror = () => {
        log(id, iframe.src + ' failed to load')

        resolve({
          ok: false,
          data: {message: 'could not load iframe'}
        })
      }
      document.body.appendChild(iframe)
    })
  }
}
