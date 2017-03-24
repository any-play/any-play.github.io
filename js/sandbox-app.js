;(() => {
  var p, channel

  // i know...
  const deferedPlugin = {}
  deferedPlugin.promise = new Promise((rs,rj) => {
    deferedPlugin.resolve = rs
    deferedPlugin.reject = rj
  })

  let store = Object.create(null)

  class Storage {
    getItem(sKey) {
      return this.hasItem(sKey) ? store[sKey] : null
    }
    setItem(key, value) {
      store[key] = value
      channel.postMessage({action: 'setStorage', key, value})
      return true
    }
    removeItem(sKey) {
      if (!this.hasItem(sKey)) return false
      delete store[sKey]
      channel.postMessage(['delStorage', sKey])
      return true
    }
    hasItem(sKey) {
      if (!sKey) return false
      return sKey in store
    }
    keys() {
      return Object.keys(store)
    }
    get length() {
      return Object.keys(store).length
    }
    clear() {
      channel.postMessage(['clearStorage', sKey])
      store = Object.create(null)
    }
    key(n) {
      return Object.keys(store)[n]
    }
  }

  window.storage = new Proxy(new Storage, {
    get(oTarget, sKey) {
      return oTarget[sKey] || oTarget.getItem(sKey)
    },
    set(oTarget, sKey, vValue) {
      if (sKey in oTarget) return false
      return oTarget.setItem(sKey, vValue)
    },
    deleteProperty(oTarget, sKey) {
      if (sKey in oTarget) return false
      return oTarget.removeItem(sKey)
    },
    enumerate(oTarget, sKey) {
      return oTarget.keys()
    },
    ownKeys(oTarget, sKey) {
      return oTarget.keys()
    },
    has(oTarget, sKey) {
      return sKey in oTarget || oTarget.hasItem(sKey)
    },
    defineProperty(oTarget, sKey, oDesc) {
      if (oDesc && 'value' in oDesc) { oTarget.setItem(sKey, oDesc.value) }
      return oTarget
    },
    getOwnPropertyDescriptor(oTarget, sKey) {
      var vValue = oTarget.getItem(sKey)
      return vValue ? {
        value: vValue,
        writable: true,
        enumerable: true,
        configurable: false
      } : undefined
    },
  })

  var establisedChannel = new Promise(resolve => {
    window.addEventListener('message', function listener(event) {
      if (event.origin === location.origin || 'webview') {
        store = event.data
        // is trusted - channel establised
        window.removeEventListener('message', listener)
        channel = event.ports[0]

        channel.onmessage = event => {
          if (event.data.action === 'eval') {
            deferedPlugin.promise.then(plugin => {
              event.ports[0].postMessage({
                ok: true,
                data: {
                  name: plugin.name,
                  settings: plugin.settings
                }
              })
            }, err => {
              event.ports[0].postMessage({ ok: false, data: err.stack })
            })

            let script = document.createElement('script')
            script.innerHTML = event.data.code

            // This ain't working in safari where a iframe is sandboxed
            // Might do it conditionaly, since it can be easier to debug
            // let src = new Blob([event.data.code]).url()
            // script.src = src
            
            window.onerror = (msg, url, lineNo, columnNo, error) => {
              deferedPlugin.reject(error)
            }

            document.body.appendChild(script)
            window.onerror = null
          }

          if (event.data.action === 'dispatch') {
            Path.dispatch(event.data.url)
              .then(data => {
                event.ports[0].postMessage({ok: true, data})
              }, err => {
                if (!err instanceof Error) {
                  console.error('When rejecting stuff use a instance of Error')
                  err = new Error('Unknown error')
                }
                let data = {stack: err.stack, message: err.message}
                event.ports[0].postMessage({ok: false, data})
              })
          }

          if (event.data.action === 'getSettings') {
            return deferedPlugin.promise.then(app => {
              event.ports[0].postMessage({ok: true, settings: app.settings})
            })
          }

          if (event.data.action === 'updateSettings') {
            deferedPlugin.promise.then(app => {
              let settings

              if (typeof app.updateSettings !== 'function')
                throw new Error('No updateSettings function exist')

              if (typeof event.data.settings === 'string')
                settings = Object.entries(JSON.parse(event.data.settings))
              else {
                settings = new FormData
              }

              for (let f of event.data.settings)
                settings.append(...f)

              return Promise.resolve(app.updateSettings(settings)).then(() => {
                event.ports[0].postMessage({ok: true, data: ''})
              })
            }).catch(err => {
              let data = {stack: err.stack, message: err.message}
              event.ports[0].postMessage({ok: false, data})
            })
          }
        }

        resolve(channel)
      }
    })
  })

  var interFace = window.AnyPlay || {}

  window.AnyPlay = {
    platform: interFace.getPlatform ? interFace.getPlatform() : document.referrer.includes('android') ? 'android' : 'webapp',
    version: interFace.getVersion ? interFace.getVersion() : '0.0.0',
    Plugin: class Plugin {
      constructor(name) {
        this.name = name
        this.settings = []

        setTimeout(() => deferedPlugin.resolve(this))
      }

      route(path, cb) {
        Path.map('/' + this.name + path, cb)
      }
    }
  }

  const unsafe_headers = [
    'accept-charset', 'accept-encoding', 'access-control-request-headers',
    'access-control-request-method', 'connection', 'content-length', 'cookie',
    'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'
  ]

  if (window.AnyPlay.platform === 'webapp') {
    window.AnyPlay.fetch = (...args) => { // Webapp proxy method
      let request = new Request(...args)
      let params = new URLSearchParams
      let headers = new Headers(args[1] && args[1].headers || request.headers)

      params.set('url', request.url)
      params.set('ignoreReqHeaders', 'true')
      params.set('setReqHeaders', JSON.stringify([...headers]))

      // http://stackoverflow.com/a/34641566/1008999
      const bodyP = request.headers.get('Content-Type') ? request.blob() : Promise.resolve()
      return bodyP.then(body =>
        fetch(new Request('https://cors-adv-proxy.herokuapp.com/?' + params, {
          method: request.method,
          body: body,
          referrer: request.referrer,
          referrerPolicy: request.referrerPolicy,
          mode: request.mode,
          cache: request.cache,
          redirect: request.redirect,
          integrity: request.integrity
        })).then(res => {
          let headers = new Headers

          for (let [key,val] of res.headers) {
            headers.append(key.replace('x-cors-res-set-', ''), val)
          }

          // res.headers = headers isn't enofgh
          Object.defineProperty(res, 'headers', {
            value: headers
          })

          return res
        })
      )
    }
  } else if (interFace.fetch) { // Android app method
    AnyPlay.fetch = (...args) => {
      let request = new Request(...args)
      let headers = new Headers(args[1] && args[1].headers || request.headers)

      return request.text().then(body => {
        var data = {
          method: request.method,
          body,
          headers: [...headers],
          redirect: request.redirect,
          integrity: request.integrity
        }

        // sync blocks :(
        // Don't have a UI either so...
        let res = interFace.fetch(request.url, JSON.stringify(data))
        res = JSON.parse(res)

        return new Response(res.body, res)
      })
    }
  }

})();
