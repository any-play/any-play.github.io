;(() => {
  let p, channel
  const country_ip_map = {AD:"85.94.160.0/19",AE:"94.200.0.0/13",AF:"149.54.0.0/17",AG:"209.59.64.0/18",AI:"204.14.248.0/21",AL:"46.99.0.0/16",AM:"46.70.0.0/15",AO:"105.168.0.0/13",AP:"159.117.192.0/21",AR:"181.0.0.0/12",AS:"202.70.112.0/20",AT:"84.112.0.0/13",AU:"1.128.0.0/11",AW:"181.41.0.0/18",AZ:"5.191.0.0/16",BA:"31.176.128.0/17",BB:"65.48.128.0/17",BD:"114.130.0.0/16",BE:"57.0.0.0/8",BF:"129.45.128.0/17",BG:"95.42.0.0/15",BH:"37.131.0.0/17",BI:"154.117.192.0/18",BJ:"137.255.0.0/16",BL:"192.131.134.0/24",BM:"196.12.64.0/18",BN:"156.31.0.0/16",BO:"161.56.0.0/16",BQ:"161.0.80.0/20",BR:"152.240.0.0/12",BS:"24.51.64.0/18",BT:"119.2.96.0/19",BW:"168.167.0.0/16",BY:"178.120.0.0/13",BZ:"179.42.192.0/18",CA:"99.224.0.0/11",CD:"41.243.0.0/16",CF:"196.32.200.0/21",CG:"197.214.128.0/17",CH:"85.0.0.0/13",CI:"154.232.0.0/14",CK:"202.65.32.0/19",CL:"152.172.0.0/14",CM:"165.210.0.0/15",CN:"36.128.0.0/10",CO:"181.240.0.0/12",CR:"201.192.0.0/12",CU:"152.206.0.0/15",CV:"165.90.96.0/19",CW:"190.88.128.0/17",CY:"46.198.0.0/15",CZ:"88.100.0.0/14",DE:"53.0.0.0/8",DJ:"197.241.0.0/17",DK:"87.48.0.0/12",DM:"192.243.48.0/20",DO:"152.166.0.0/15",DZ:"41.96.0.0/12",EC:"186.68.0.0/15",EE:"90.190.0.0/15",EG:"156.160.0.0/11",ER:"196.200.96.0/20",ES:"88.0.0.0/11",ET:"196.188.0.0/14",EU:"2.16.0.0/13",FI:"91.152.0.0/13",FJ:"144.120.0.0/16",FM:"119.252.112.0/20",FO:"88.85.32.0/19",FR:"90.0.0.0/9",GA:"41.158.0.0/15",GB:"25.0.0.0/8",GD:"74.122.88.0/21",GE:"31.146.0.0/16",GF:"161.22.64.0/18",GG:"62.68.160.0/19",GH:"45.208.0.0/14",GI:"85.115.128.0/19",GL:"88.83.0.0/19",GM:"160.182.0.0/15",GN:"197.149.192.0/18",GP:"104.250.0.0/19",GQ:"105.235.224.0/20",GR:"94.64.0.0/13",GT:"168.234.0.0/16",GU:"168.123.0.0/16",GW:"197.214.80.0/20",GY:"181.41.64.0/18",HK:"113.252.0.0/14",HN:"181.210.0.0/16",HR:"93.136.0.0/13",HT:"148.102.128.0/17",HU:"84.0.0.0/14",ID:"39.192.0.0/10",IE:"87.32.0.0/12",IL:"79.176.0.0/13",IM:"5.62.80.0/20",IN:"117.192.0.0/10",IO:"203.83.48.0/21",IQ:"37.236.0.0/14",IR:"2.176.0.0/12",IS:"82.221.0.0/16",IT:"79.0.0.0/10",JE:"87.244.64.0/18",JM:"72.27.0.0/17",JO:"176.29.0.0/16",JP:"126.0.0.0/8",KE:"105.48.0.0/12",KG:"158.181.128.0/17",KH:"36.37.128.0/17",KI:"103.25.140.0/22",KM:"197.255.224.0/20",KN:"198.32.32.0/19",KP:"175.45.176.0/22",KR:"175.192.0.0/10",KW:"37.36.0.0/14",KY:"64.96.0.0/15",KZ:"2.72.0.0/13",LA:"115.84.64.0/18",LB:"178.135.0.0/16",LC:"192.147.231.0/24",LI:"82.117.0.0/19",LK:"112.134.0.0/15",LR:"41.86.0.0/19",LS:"129.232.0.0/17",LT:"78.56.0.0/13",LU:"188.42.0.0/16",LV:"46.109.0.0/16",LY:"41.252.0.0/14",MA:"105.128.0.0/11",MC:"88.209.64.0/18",MD:"37.246.0.0/16",ME:"178.175.0.0/17",MF:"74.112.232.0/21",MG:"154.126.0.0/17",MH:"117.103.88.0/21",MK:"77.28.0.0/15",ML:"154.118.128.0/18",MM:"37.111.0.0/17",MN:"49.0.128.0/17",MO:"60.246.0.0/16",MP:"202.88.64.0/20",MQ:"109.203.224.0/19",MR:"41.188.64.0/18",MS:"208.90.112.0/22",MT:"46.11.0.0/16",MU:"105.16.0.0/12",MV:"27.114.128.0/18",MW:"105.234.0.0/16",MX:"187.192.0.0/11",MY:"175.136.0.0/13",MZ:"197.218.0.0/15",NA:"41.182.0.0/16",NC:"101.101.0.0/18",NE:"197.214.0.0/18",NF:"203.17.240.0/22",NG:"105.112.0.0/12",NI:"186.76.0.0/15",NL:"145.96.0.0/11",NO:"84.208.0.0/13",NP:"36.252.0.0/15",NR:"203.98.224.0/19",NU:"49.156.48.0/22",NZ:"49.224.0.0/14",OM:"5.36.0.0/15",PA:"186.72.0.0/15",PE:"186.160.0.0/14",PF:"123.50.64.0/18",PG:"124.240.192.0/19",PH:"49.144.0.0/13",PK:"39.32.0.0/11",PL:"83.0.0.0/11",PM:"70.36.0.0/20",PR:"66.50.0.0/16",PS:"188.161.0.0/16",PT:"85.240.0.0/13",PW:"202.124.224.0/20",PY:"181.120.0.0/14",QA:"37.210.0.0/15",RE:"139.26.0.0/16",RO:"79.112.0.0/13",RS:"178.220.0.0/14",RU:"5.136.0.0/13",RW:"105.178.0.0/15",SA:"188.48.0.0/13",SB:"202.1.160.0/19",SC:"154.192.0.0/11",SD:"154.96.0.0/13",SE:"78.64.0.0/12",SG:"152.56.0.0/14",SI:"188.196.0.0/14",SK:"78.98.0.0/15",SL:"197.215.0.0/17",SM:"89.186.32.0/19",SN:"41.82.0.0/15",SO:"197.220.64.0/19",SR:"186.179.128.0/17",SS:"105.235.208.0/21",ST:"197.159.160.0/19",SV:"168.243.0.0/16",SX:"190.102.0.0/20",SY:"5.0.0.0/16",SZ:"41.84.224.0/19",TC:"65.255.48.0/20",TD:"154.68.128.0/19",TG:"196.168.0.0/14",TH:"171.96.0.0/13",TJ:"85.9.128.0/18",TK:"27.96.24.0/21",TL:"180.189.160.0/20",TM:"95.85.96.0/19",TN:"197.0.0.0/11",TO:"175.176.144.0/21",TR:"78.160.0.0/11",TT:"186.44.0.0/15",TV:"202.2.96.0/19",TW:"120.96.0.0/11",TZ:"156.156.0.0/14",UA:"93.72.0.0/13",UG:"154.224.0.0/13",US:"3.0.0.0/8",UY:"167.56.0.0/13",UZ:"82.215.64.0/18",VA:"212.77.0.0/19",VC:"24.92.144.0/20",VE:"186.88.0.0/13",VG:"172.103.64.0/18",VI:"146.226.0.0/16",VN:"14.160.0.0/11",VU:"202.80.32.0/20",WF:"117.20.32.0/21",WS:"202.4.32.0/19",YE:"134.35.0.0/16",YT:"41.242.116.0/22",ZA:"41.0.0.0/11",ZM:"165.56.0.0/13",ZW:"41.85.192.0/19"}

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
              }, err => {
                let data = {stack: err.stack, message: err.message}
                event.ports[0].postMessage({ok: false, data})
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
    TYPE_DASH: 'application/dash+xml',
    TYPE_HLS: 'application/x-mpegurl',
    TYPE_MP4: 'video/mp4',
    platform: interFace.getPlatform ? interFace.getPlatform() : document.referrer.includes('android') ? 'android' : 'webapp',
    version: interFace.getVersion ? interFace.getVersion() : '0.0.0',
    Plugin: class Plugin {
      constructor(name) {
        this.name = name
        this.settings = []

        setTimeout(() => deferedPlugin.resolve(this))
      }

      route(path, cb, strategy) {
        Path.map('/' + this.name + path, cb, strategy)
      }
    }
  }

  // const unsafe_headers = [
  //   'accept-charset', 'accept-encoding', 'access-control-request-headers',
  //   'access-control-request-method', 'connection', 'content-length', 'cookie',
  //   'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer',
  //   'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'
  // ]

  if (window.AnyPlay.platform === 'webapp') {
    window.AnyPlay.fetch = (...args) => { // Webapp proxy method
      let request = new Request(...args)
      let params = new URLSearchParams
      let headers = new Headers(args[1] && args[1].headers || request.headers)

      const url = new URL(request.url)
      // const strategy = url.searchParams.get('strategy')
      //
      // if (strategy !== null) {
      //   url.searchParams.delete('strategy')
      //   params.set('strategy', strategy)
      // }

      params.set('url', url)
      params.set('ignoreReqHeaders', 'true')
      params.set('setReqHeaders', JSON.stringify([...headers]))
      request.redirect !== 'follow' && params.set('noFollow', 'true')



      function sendMessage(message) {
        return new Promise((resolve, reject) => {
          let messageChannel = new MessageChannel
          mc.port1.postMessage(message, [messageChannel.port2])
        })
      }

      // http://stackoverflow.com/a/34641566/1008999
      const bodyP = request.headers.get('Content-Type') ? request.arrayBuffer() : Promise.resolve()
      return bodyP.then(body => {
        return new Promise((rs, rj) => {
          const channel = new MessageChannel
          channel.port1.onmessage = evt => {
            let res = new Response(evt.data[0], {status: evt.status})
            let headers = new Headers

            for (let [key,val] of res.headers) {
              headers.append(key.replace('x-cors-', ''), val)
            }

            // res.headers = headers isn't enofgh
            Object.defineProperty(res, 'headers', {
              value: headers
            })

            rs(res)
          }

          // Ask top frame to make the request for us.
          top.postMessage({
            url: 'https://cors-adv-proxy.herokuapp.com/?' + params,
            request: {
              method: request.method,
              body: body,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy,
              mode: request.mode,
              cache: request.cache,
              redirect: request.redirect,
              integrity: request.integrity
            }
          }, '*', [channel.port2])
        })
      })
    }
  }
  else if (interFace.fetch) { // Android app method
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

  function parseCIDR(CIDR) {
  	// Beginning IP address
  	const beg = CIDR.substr(CIDR,CIDR.indexOf('/'))
  	const off = (1 << (32 - parseInt(CIDR.substr(CIDR.indexOf('/') + 1)))) - 1
  	const sub = beg.split('.').map(a => ~~a)

  	// An IPv4 address is just an UInt32...
  	const buf = new ArrayBuffer(4) //4 octets
  	const i32 = new Uint32Array(buf)

  	// Get the UInt32, and add the bit difference
  	i32[0]  = (sub[0] << 24) + (sub[1] << 16) + (sub[2] << 8) + sub[3] + off

  	// Recombine into an IPv4 string:
  	const end = Array(...new Uint8Array(buf)).reverse()

    sub[3] = 1 // ip can't end with 0

    const rand = (low, high) => low + Math.random() * (high - low)|0

    return end.map((end, i) => rand(sub[i], end)).join('.')
  }

  AnyPlay.randomIPv4 = country => parseCIDR(country_ip_map[country.toUpperCase()])

})();
