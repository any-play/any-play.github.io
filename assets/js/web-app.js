'use strict'

;(async(function* (){
  // Regex to test if code is a url and only one line...
  let canceler = new AbortController

  function OverrideProtectionKeyController() {
      var parent = this.parent

      return {
          getSupportedKeySystemsFromContentProtection(cps) {
              var cp, ks, ksIdx, cpIdx
              var supportedKS = []
              var keySystems = parent.getKeySystems()
              var cpsWithKeyId = cps.find(function (element) {
                  return element.KID !== null
              })

              if (cps) {
                  for (ksIdx = 0; ksIdx < keySystems.length; ++ksIdx) {
                      ks = keySystems[ksIdx];
                      for (cpIdx = 0; cpIdx < cps.length; ++cpIdx) {
                          cp = cps[cpIdx];
                          if (cp.schemeIdUri.toLowerCase() === ks.schemeIdURI) {

                              // Look for DRM-specific ContentProtection
                              var initData = ks.getInitData(cp, cpsWithKeyId.KID);
                              if (initData) {
                                  supportedKS.push({
                                      ks: keySystems[ksIdx],
                                      initData: initData
                                  });
                              }
                          }
                      }
                  }
              }
              return supportedKS;
          }
      }
  }

  function OverrideKeySystemWidevine() {
    return {
      getInitData(cpData, kid) {
        this.kid = kid
        if ('pssh' in cpData) {
          return BASE64.decodeArray(cpData.pssh.__text).buffer
        }
        return null
      },

      getLicenseRequestFromMessage(message) {
        return JSON.stringify({
          token: OverrideKeySystemWidevine.VUDRM_TOKEN,
          drm_info: Array.from(new Uint8Array(message)),
          kid: this.kid
        })
      }
    }
  }

  // Utilities
  let isObject = x => x && typeof x === 'object' && !Array.isArray(x)

  /**
   * Deep merge two objects.
   * @param target
   * @param ...sources
   */
  function mergeDeep(target, ...sources) {
    if (!sources.length) return target
    const source = sources.shift()

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} })
          mergeDeep(target[key], source[key])
        } else {
          Object.assign(target, { [key]: source[key] })
        }
      }
    }

    return mergeDeep(target, ...sources)
  }

  function el(name, ...args) {
    var isNode = n => n && typeof n === 'object' && n.nodeType && n.nodeName
    var node = isNode(name) ? name : document.createElement(name)

    for (let arg of args) {
      if (arg instanceof Array) {
        arg.forEach(child => {
          child && node.appendChild(child)
        })
      } else if (typeof arg === 'object') {
        if (isNode(arg)) {
          node.appendChild(arg)
        } else if (arg) {
          mergeDeep(node, arg)
        }
      } else {
        node.textContent = arg
      }
    }

    return node
  }

  let $ = (selector, fragment = document) => fragment.querySelector(selector)
  let setVal = file => file.text().then(txt => (_code.value = txt)).catch(()=>{alert(1)})
  let stop = evt => evt && evt.stopPropagation(evt.preventDefault())
  let {plugins} = yield app.getPlugins
  let loader = $('#loader')
  let _alert = $('#_alert')
  let uuid = 0
  let observer = new IntersectionObserver((changes, observer) => {
    changes.forEach(function(change) {
      if (!change.isIntersecting) return
      var el = change.target
      el.src = el.dataset.src
      observer.unobserve(el)
    })
  }, {
    rootMargin: '100% 0%',
    threshold: [0]
  })

  app.filesDroped = evt => setVal(evt.dataTransfer.files[0], stop(evt))

  function displayContent(evt, content) {
    stop(evt)
    $overview.innerHTML = ''
    loader.hidden = false

    canceler.abort()
    canceler = new AbortController
    let {signal} = canceler

    app.get(location.pathname, {signal}).then(res => {
      loader.hidden = true

      if (!res.ok) {
        _alert.showModal()
        $('p', _alert).innerText = res.data.message
        $('code', _alert).innerText = res.data.stack
        return
      }

      if (res.data.video && res.data.video.source.length) {
        const video = el('video', {style: {maxWidth: '100%'}})

        el($overview, video)
        const player = window.player = new MediaElementPlayer(video, {
          features: [
            'prevtrack', 'playpause', 'nexttrack', 'current', 'progress',
            'duration', 'speed', 'skipback', 'jumpforward', 'markers', 'volume',
		        'playlist', 'loop', 'shuffle', 'contextmenu', 'fullscreen', 'chromecast'
          ]
        })

        player.setSrc(res.data.video.source)
        player.play()
      }


      res.data.links && el($overview, res.data.links.map(link =>
        el('li', {className: 'linkItem card'}, [
          link.poster && el('img', {dataset: {src: link.poster}}),
          el('a', link.title, {
            href: '/' + res.plugin + link.src
          }),
        ])
      ))

      $overview.querySelectorAll('img').forEach(elm => observer.observe(elm))

    }, err => {
      loader.hidden = true
    })
  }

  app.loadPlugin = evt => setVal(evt.target.files[0])

  app.loadPluginPage = evt => {
    stop(evt)
    canceler.abort()
    canceler = new AbortController
    $overview.innerHTML = ''

    var fragment = document.createDocumentFragment()
    fragment.appendChild(document.importNode($pluginForm.content, true))

    $overview.appendChild(fragment)

    const remove = evt => {
      let section = evt.target.closest('section')
      section.remove()
      app.delete(section.dataset.name)
    }

    for (let plugin of plugins) {
      el($overview, el('section', {dataset: {name: plugin.name}, className: 'pluginItem card'}, [
        el('a', plugin.name, {href: `/${plugin.name}/`}),
        el('button', 'Settings', {onclick: openSettings}),
        el('button', 'Delete', {onclick: remove})
      ]))
    }

  }

  const colors = [["#00467F","#A5CC82"],["#1488CC","#2B32B2"],["#ec008c","#fc6767"],["#cc2b5e","#753a88"],["#2193b0","#6dd5ed"],["#e65c00","#F9D423"],["#2b5876","#4e4376"],["#314755","#26a0da"],["#77A1D3","#79CBCA","#E684AE"],["#ff6e7f","#bfe9ff"],["#e52d27","#b31217"],["#603813","#b29f94"],["#16A085","#F4D03F"],["#D31027","#EA384D"],["#EDE574","#E1F5C4"],["#02AAB0","#00CDAC"],["#DA22FF","#9733EE"],["#348F50","#56B4D3"],["#3CA55C","#B5AC49"],["#CC95C0","#DBD4B4","#7AA1D2"],["#003973","#E5E5BE"],["#E55D87","#5FC3E4"],["#403B4A","#E7E9BB"],["#F09819","#EDDE5D"],["#FF512F","#DD2476"],["#AA076B","#61045F"],["#1A2980","#26D0CE"],["#FF512F","#F09819"],["#1D2B64","#F8CDDA"],["#1FA2FF","#12D8FA","#A6FFCB"],["#4CB8C4","#3CD3AD"],["#DD5E89","#F7BB97"],["#EB3349","#F45C43"],["#1D976C","#93F9B9"],["#FF8008","#FFC837"],["#16222A","#3A6073"],["#1F1C2C","#928DAB"],["#614385","#516395"],["#4776E6","#8E54E9"],["#085078","#85D8CE"],["#2BC0E4","#EAECC6"],["#134E5E","#71B280"],["#5C258D","#4389A2"],["#757F9A","#D7DDE8"],["#232526","#414345"],["#1CD8D2","#93EDC7"],["#3D7EAA","#FFE47A"],["#283048","#859398"],["#24C6DC","#514A9D"],["#DC2424","#4A569D"],["#ED4264","#FFEDBC"],["#DAE2F8","#D6A4A4"],["#ECE9E6","#FFFFFF"],["#7474BF","#348AC7"],["#EC6F66","#F3A183"],["#5f2c82","#49a09d"],["#C04848","#480048"],["#e43a15","#e65245"],["#414d0b","#727a17"],["#FC354C","#0ABFBC"],["#4b6cb7","#182848"],["#f857a6","#ff5858"],["#a73737","#7a2828"],["#d53369","#cbad6d"],["#e9d362","#333333"],["#DE6262","#FFB88C"],["#666600","#999966"],["#FFEEEE","#DDEFBB"],["#EFEFBB","#D4D3DD"],["#c21500","#ffc500"],["#215f00","#e4e4d9"],["#50C9C3","#96DEDA"],["#616161","#9bc5c3"],["#ddd6f3","#faaca8"],["#5D4157","#A8CABA"],["#E6DADA","#274046"],["#DAD299","#B0DAB9"],["#D3959B","#BFE6BA"],["#00d2ff","#3a7bd5"],["#870000","#190A05"],["#B993D6","#8CA6DB"],["#649173","#DBD5A4"],["#C9FFBF","#FFAFBD"],["#606c88","#3f4c6b"],["#000000","#53346D"],["#FBD3E9","#BB377D"],["#ADD100","#7B920A"],["#FF4E50","#F9D423"],["#F0C27B","#4B1248"],["#000000","#e74c3c"],["#AAFFA9","#11FFBD"],["#B3FFAB","#12FFF7"],["#780206","#061161"],["#9D50BB","#6E48AA"],["#556270","#FF6B6B"],["#70e1f5","#ffd194"],["#00c6ff","#0072ff"],["#fe8c00","#f83600"],["#52c234","#061700"],["#485563","#29323c"],["#83a4d4","#b6fbff"],["#FDFC47","#24FE41"],["#abbaab","#ffffff"],["#73C8A9","#373B44"],["#D38312","#A83279"],["#1e130c","#9a8478"],["#948E99","#2E1437"],["#360033","#0b8793"],["#FFA17F","#00223E"],["#43cea2","#185a9d"],["#ffb347","#ffcc33"],["#6441A5","#2a0845"],["#FEAC5E","#C779D0","#4BC0C8"],["#833ab4","#fd1d1d","#fcb045"],["#ff0084","#33001b"],["#00bf8f","#001510"],["#136a8a","#267871"],["#8e9eab","#eef2f3"],["#7b4397","#dc2430"],["#D1913C","#FFD194"],["#F1F2B5","#135058"],["#6A9113","#141517"],["#004FF9","#FFF94C"],["#525252","#3d72b4"],["#BA8B02","#181818"],["#ee9ca7","#ffdde1"],["#304352","#d7d2cc"],["#CCCCB2","#757519"],["#2c3e50","#3498db"],["#fc00ff","#00dbde"],["#e53935","#e35d5b"],["#005C97","#363795"],["#f46b45","#eea849"],["#00C9FF","#92FE9D"],["#673AB7","#512DA8"],["#76b852","#8DC26F"],["#8E0E00","#1F1C18"],["#FFB75E","#ED8F03"],["#c2e59c","#64b3f4"],["#403A3E","#BE5869"],["#C02425","#F0CB35"],["#B24592","#F15F79"],["#457fca","#5691c8"],["#6a3093","#a044ff"],["#eacda3","#d6ae7b"],["#fd746c","#ff9068"],["#114357","#F29492"],["#1e3c72","#2a5298"],["#2F7336","#AA3A38"],["#5614B0","#DBD65C"],["#4DA0B0","#D39D38"],["#5A3F37","#2C7744"],["#2980b9","#2c3e50"],["#0099F7","#F11712"],["#834d9b","#d04ed6"],["#4B79A1","#283E51"],["#000000","#434343"],["#4CA1AF","#C4E0E5"],["#E0EAFC","#CFDEF3"],["#BA5370","#F4E2D8"],["#ff4b1f","#1fddff"],["#f7ff00","#db36a4"],["#a80077","#66ff00"],["#1D4350","#A43931"],["#EECDA3","#EF629F"],["#16BFFD","#CB3066"],["#ff4b1f","#ff9068"],["#FF5F6D","#FFC371"],["#2196f3","#f44336"],["#00d2ff","#928DAB"],["#3a7bd5","#3a6073"],["#0B486B","#F56217"],["#e96443","#904e95"],["#2C3E50","#4CA1AF"],["#2C3E50","#FD746C"],["#F00000","#DC281E"],["#141E30","#243B55"],["#42275a","#734b6d"],["#000428","#004e92"],["#56ab2f","#a8e063"],["#cb2d3e","#ef473a"],["#f79d00","#64f38c"],["#f85032","#e73827"],["#fceabb","#f8b500"],["#808080","#3fada8"],["#ffd89b","#19547b"],["#bdc3c7","#2c3e50"],["#BE93C5","#7BC6CC"],["#A1FFCE","#FAFFD1"],["#4ECDC4","#556270"],["#3a6186","#89253e"],["#ef32d9","#89fffd"],["#de6161","#2657eb"],["#ff00cc","#333399"],["#fffc00","#ffffff"],["#ff7e5f","#feb47b"],["#00c3ff","#ffff1c"],["#f4c4f3","#fc67fa"],["#41295a","#2F0743"],["#A770EF","#CF8BF3","#FDB99B"],["#ee0979","#ff6a00"],["#F3904F","#3B4371"],["#67B26F","#4ca2cd"],["#3494E6","#EC6EAD"],["#DBE6F6","#C5796D"],["#c0c0aa","#1cefff"],["#DCE35B","#45B649"],["#E8CBC0","#636FA4"],["#F0F2F0","#000C40"],["#FFAFBD","#ffc3a0"],["#43C6AC","#F8FFAE"],["#093028","#237A57"],["#43C6AC","#191654"],["#4568DC","#B06AB3"],["#0575E6","#021B79"],["#200122","#6f0000"],["#44A08D","#093637"],["#6190E8","#A7BFE8"],["#34e89e","#0f3443"],["#F7971E","#FFD200"],["#C33764","#1D2671"],["#20002c","#cbb4d4"],["#D66D75","#E29587"],["#30E8BF","#FF8235"],["#B2FEFA","#0ED2F7"],["#4AC29A","#BDFFF3"],["#E44D26","#F16529"],["#EB5757","#000000"],["#F2994A","#F2C94C"],["#56CCF2","#2F80ED"],["#007991","#78ffd6"],["#000046","#1CB5E0"],["#159957","#155799"],["#c0392b","#8e44ad"],["#EF3B36","#FFFFFF"],["#283c86","#45a247"],["#3A1C71","#D76D77","#FFAF7B"],["#CB356B","#BD3F32"],["#36D1DC","#5B86E5"],["#000000","#0f9b0f"],["#1c92d2","#f2fcfe"],["#642B73","#C6426E"],["#06beb6","#48b1bf"],["#0cebeb","#20e3b2","#29ffc6"],["#000000","#E5008D","#FF070B"],["#070000","#4C0001","#070000"],["#d9a7c7","#fffcdc"],["#396afc","#2948ff"],["#C9D6FF","#E2E2E2"],["#7F00FF","#E100FF"],["#ff9966","#ff5e62"],["#22c1c3","#fdbb2d"],["#1a2a6c","#b21f1f","#fdbb2d"],["#e1eec3","#f05053"],["#ADA996","#F2F2F2","#DBDBDB","#EAEAEA"],["#667db6","#0082c8","#0082c8","#667db6"],["#03001e","#7303c0","#ec38bc","#fdeff9"],["#6D6027","#D3CBB8"],["#74ebd5","#ACB6E5"],["#e1eec3","#f05053"],["#fc4a1a","#f7b733"],["#800080","#ffc0cb"],["#CAC531","#F3F9A7"],["#3C3B3F","#605C3C"]]

  const random = (b,c,d,f,g=((k,s,t)=> u=>{for(s of u)k+=s.charCodeAt(0),t=.02519603282416938*k,k=t>>>0,t-=k,t*=k,k=t>>>0,t-=k,k+=4294967296*t;return 2.3283064365386963e-10*(k>>>0)})(4022871197),h=1)=>(c=g(' '),d=g(' '),f=g(' '),c-=g(b),0>c&&(c+=1),d-=g(b),0>d&&(d+=1),f-=g(b),0>f&&(f+=1),b=2091639*c+2.3283064365386963e-10*h,f=b-(0|b));

  app.loadHomePage = evt => {
    stop(evt)
    $overview.innerHTML = ''
    canceler.abort()
    canceler = new AbortController
    let {signal} = canceler

    el($overview, plugins.map(plugin => {
      var section

      app.get(`/${plugin.name}/`, {signal}).then(res => {

        el(section, res.data.links.map(link =>
          el('li', {className: 'linkItem card'},
            el('a', {
                style: {background: `linear-gradient(135deg,${colors[Math.floor(random(link.title) * (colors.length + 1))]})`},
                href: '/' + plugin.name + link.src
              }, [
                el('span', link.title, {style: {position: 'absolute'}}),
                el('img', { src: link.poster, onerror(){ this.remove() } })
              ]
            )
          )
        ))

      }, err => {
        if (!err.name || err.name !== 'AbortError')
          console.error(err)
      })

      return el('section', {className: 'horizontalMenu'}, [
        el('a', {href: '/' + plugin.name},
          el('h3', plugin.name)
        ),
        section = el('ul')
      ])
    }))
  }

  app.submitPlugin = evt => {
    stop(evt)
    app.addPlugin(evt.target.elements.code.value).then(res => {
      res.ok ? app.loadPluginPage() : alert(res.data.message)
    })
  }

  app._updateSettings = event => {
    stop(event)

    let fd = new FormData(event.target)
    app.updateSettings(window._settingsDialog.dataset.name, [...fd])
    .then(res => {
      if (!res.ok) {
        _alert.showModal()
        $('p', _alert).innerText = res.data.message
        $('code', _alert).innerText = res.data.stack
      }
    })
  }

  function openSettings(event) {
    let section = event.target.closest('section')
    let pluginName = section.dataset.name
    app.getSettings(pluginName).then(({settings}) => {
      let dialog = window._settingsDialog
      let section = $('section', dialog)
      dialog.dataset.name = pluginName
      dialog.showModal()
      $('header h3', dialog).innerText = 'Settings - ' + pluginName
      section.innerHTML = ''

      settings.forEach((field, index) => {
        el(section,
          el('div', {className: 'input-container'}, [
            el('input', {
              id: 'input_' + (uuid++),
              autofocus: !index,
              type: field.type,
              defaultValue: field.defaultValue,
              value: field.value,
              name: field.name,
              minLength: field.minLength || 0,
              placeholder: ' '
            }),
            el('label', field.label, {htmlFor: 'input_' + (uuid-1)})
          ])
        )
      })

    })
  }

  let nav = () => {
    switch (location.pathname) {
      case '/': app.loadHomePage(); break;
      case '/plugins': app.loadPluginPage(); break;
      default: displayContent(); break;
    }
  }

  document.onclick = evt => {
    const currentTarget = evt.target.closest('a')

    if (currentTarget) {
      history.pushState({}, 'fff', currentTarget.href)
      nav(stop(evt))
    }
  }

  window.onpopstate = nav; nav()

}))();
