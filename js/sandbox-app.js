;(() => {
  var p

  // i know...
  var deferedPlugin = {}
  deferedPlugin.promise = new Promise((rs,rj) => {
    deferedPlugin.resolve = rs
    deferedPlugin.reject = rj
  })

  var establisedChannel = new Promise(resolve => {
    window.addEventListener('message', function listener(event){
      if (event.origin === location.origin || 'webview') {
        // is trusted - channel establised
        window.removeEventListener('message', listener)
        let channel = event.ports[0]

        channel.onmessage = event => {
          if (event.data.action === 'eval') {
            deferedPlugin.promise.then(plugin => {
              event.ports[0].postMessage({ ok: true, data: {name: plugin.name} })
            }, err => {
              event.ports[0].postMessage({ ok: false, data: err.stack })
            })

            try {
              new Function('Path', event.data.code)()
            } catch(err) {
              deferedPlugin.reject(err)
            }
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

          if (event.data.action === 'login') {
            deferedPlugin.promise.then(app => {
              if (typeof app.login !== 'function')
                throw new Error('No login function exist')

              return Promise.resolve(app.login(event.data.body)).then(data => {
                event.ports[0].postMessage({ok: true, data})
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
    Plugin: class {
      constructor(name) {
        this.name = name
        setTimeout(() => deferedPlugin.resolve(this))
      }

      route(path, cb) {
        Path.map('/' + this.name + path, values => cb(values))
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

      request = new Request('https://cors-adv-proxy.herokuapp.com/?' + params, request)
      request = new Request(request, {headers: []})

      return fetch(request)
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
  } else { // OLD METHOD
    AnyPlay.fetch = (...args) => {
      console.warn('Please update your app')

      let request = new Request(...args)
      let reqHeaders = new Headers(args[1] && args[1].headers || request.headers)
      let headers = new Headers

      for (let [h, v] of reqHeaders) {
        h = h.replace(/^x-play-/, '')
        if (unsafe_headers.includes(h.toLowerCase())) {
          h = 'x-play-' + h
        }
        headers.append(h, v)
      }

      return fetch(new Request(request, {headers}))
    }
  }

})();
