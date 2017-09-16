function async(a){return(...b)=>{var c=a(...b),d=e=>e.done?Promise.resolve(e.value):Promise.resolve(e.value).then(f=>d(c.next(f)),f=>d(c.throw(f)));try{return d(c.next())}catch(e){return Promise.reject(e)}}}

window.jsonp = uuid => result => AnyPlay.callback(uuid, JSON.stringify(result))

if (!window.AbortController) {

  class AbortSignal {
    constructor() {
      const delegate = document.createDocumentFragment()
      const methods = ['addEventListener', 'dispatchEvent', 'removeEventListener']

      methods.forEach(method =>
        this[method] = (...args) => delegate[method](...args)
      )

      this.aborted = false
    }
  }

  class AbortController {
    constructor() {
      this.signal = new AbortSignal
    }
    abort() {
      this.signal.aborted = true
      this.signal.dispatchEvent(new Event('abort'))
    }
  }

  window.AbortController = AbortController
}

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

const dbPlugins = db => db.transaction('plugins', 'readwrite').objectStore('plugins')
const URL_REGEXP = /^[a-z][a-z\d.+-]*:\/*(?:[^:@]+(?::[^@]+)?@)?(?:[^\s:/?#]+|\[[a-f\d:]+])(?::\d+)?(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i

/**
 * Creates a indexedDB database structure if such dose not exist
 */
const onupgradeneeded = event => {
  event.target.result.createObjectStore('plugins', {autoIncrement : true})
}

const openDB = new Promise(rs => {
  let request = indexedDB.open('tv', 1)
  request.onupgradeneeded = onupgradeneeded
  request.onsuccess = evt => rs(request.result)
})

window.app = {
  id: 0,

  /**
   * [plugins description]
   *
   * @type {Object}
   */
  plugins: {},

  /**
   * (Used internally)
   * it will create a iframe if the plugin hasn't loaded
   *
   * @private
   * @param  {String}  plugin [description]
   * @param  {Mixed}   msg    [description]
   * @return {Promise}        [description]
   */
  postMessage(plugin, msg) {
    return async(function* () {

      if (!app.plugins[plugin]) {
        let {plugins} = yield app.getPlugins
        let record = plugins.find(record => record.name === plugin)
        yield app.load(record.code, record.storage)
      }

      return window.app.plugins[plugin].sendMessage(msg)
    })()
  },

  /**
   * Request a matching route in the plugin
   * ex: app.get('/pluginName/categories/children')
   *
   * @param  {String}  url    [description]
   * @return {Promise}        [description]
   */
  get(url, init) {
    const id = app.id++
    const plugin = url.split('/')[1]
    const request = app.postMessage(plugin, { action: 'dispatch', url })
    .then(response => {
      log(`app.get [${plugin}-${id}]`, 'response: ', response)
      response.plugin = plugin
      return response
    })

    log(`app.get [${plugin}-${id}]`, 'requesting url: ' + url)

    if (init && init.signal) {
      // // Turn an event into a promise, reject it once `abort` is dispatched
      const cancellation = new Promise((_, reject) => {
        init.signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          {once: true}
        )
      })

      return Promise.race([cancellation, request])
    }

    // Return the fastest promise (don't need to wait for request to finish)
    return request
  },

  /**
   * The settings is not saved by AnyPlay, we simply pass
   * this along to the plugin and let them do whatever they want with it
   *
   * @param {String}   plugin    The plugin name
   * @param {Array}    settings  2D array like this: [[key, val], [key, val]]
   * @return {Promise}
   */
  updateSettings(plugin, settings) {
    return app.postMessage(plugin, { action: 'updateSettings', settings })
  },

  /**
   * Load all plugins
   */
  getPlugins: openDB.then(db => {
    return new Promise(rs => {
      let plugins = []
      let store = dbPlugins(db)
      let cursorRequest = store.openCursor()
      cursorRequest.onerror = console.error
      cursorRequest.onsuccess = evt => {
        let cursor = evt.target.result
        if (cursor) {
          cursor.value.id = cursor.key
          plugins.push(cursor.value)
          cursor.continue()
        } else {
          rs({ok: true, plugins})
        }
      }
    })
  }),


  addPlugin: async(function* (code) {
    let {plugins} = yield app.getPlugins
    let storage = Math.random()
    let url = null

    if (code.match(URL_REGEXP)) {
      url = code
      code = yield fetch(code).then(res => res.text())
    }

    let res = yield app.load(code, storage)
    let plugin = {name: null, code, url, storage}

    if (!res.ok) return res

    plugin.name = res.data.name

    let db = yield openDB
    let store = dbPlugins(db)
    return new Promise(rs => {
      dbPlugins(db).add(plugin).onsuccess = event => {
        plugin.id = event.target.result
        plugins.push(plugin)
        rs({ok: true, plugins})
      }
    })


  }),

  /**
   * [remove description]
   * @param  {[type]} plugin [description]
   * @return {[type]}        [description]
   */
  delete(plugin) {
    app.plugins[plugin] && app.plugins[plugin].iframe.remove()
    delete app.plugins[plugin]
    return app.getPlugins.then(({plugins}) => {
      let item = plugins.find(a => a.name === plugin)
      localStorage.removeItem(item.storage)
      plugins.splice(plugins.indexOf(item), 1)
      openDB.then(db =>
        db.transaction('plugins', 'readwrite').objectStore('plugins').delete(item.id)
      )
      return {ok: true, plugins}
    })
  },

  getSettings(plugin) {
    return app.postMessage(plugin, { action: 'getSettings' })
  },

  /**
   * Should not be called from outside
   *
   * @private
   * @param  {String} code plugin code to eval
   * @return {String}      The storage it should use
   */
  load(code, storage) {
    let id = app.id++
    let iframe = document.createElement('iframe')
    let mc = new MessageChannel
    let store = localStorage[storage] ? JSON.parse(localStorage[storage]) : {}

    mc.port1.onmessage = evt => {
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

    iframe.src = '/assets/views/sandbox.html'
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

            return {ok: false, data: {message: `A plugin name called "${result.data.name}" already exist`}}
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
          data: {message: 'could not load sandbox iframe'}
        })
      }
      document.body.appendChild(iframe)
    })
  }
}
