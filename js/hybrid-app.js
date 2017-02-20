function async(a){return(...b)=>{var c=a(...b),d=e=>e.done?Promise.resolve(e.value):Promise.resolve(e.value).then(f=>d(c.next(f)),f=>d(c.throw(f)));try{return d(c.next())}catch(e){return Promise.reject(e)}}}

window.jsonp = uuid => result => AnyPlay.callback(uuid, JSON.stringify(result))

window.log = (id, ...args) => {
  console.log(`%c ${id} `, 'background: #222; color: #bada55', ...args)
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

  login(plugin, body) {
    return app.postMessage(plugin, { action: 'login', body })
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
  load(code) {
    let id = app.id++
    groupCollapsed(id, 'loading code', code)
    log(id, 'creating iframe')
    let iframe = document.createElement('iframe')
    let mc = new MessageChannel

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

    return new Promise((resolve)=>{
      iframe.onload = () => {
        log(id, iframe.src + ' loaded successfully')
        iframe.contentWindow.postMessage('Hello from parent', '*', [mc.port2])

        log(id, 'evaling code')
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
            log(id, result.data.name + ' already exist')
            log(id, 'removing iframe')
            iframe.remove()

            return {ok: false, data: {message: 'A plugin with that name already exist'}}
          }

          log(id, result.data.name + ' has been added')
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
