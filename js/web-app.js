'use strict'

;(async(function* (){
  // Regex to test if code is a url and only one line...
  const URL_REGEXP = /^[a-z][a-z\d.+-]*:\/*(?:[^:@]+(?::[^@]+)?@)?(?:[^\s:/?#]+|\[[a-f\d:]+])(?::\d+)?(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i

  /**
   * Creates a indexedDB database structure if such dose not exist
   */
  const onupgradeneeded = event => {
    let db = event.target.result
    db.createObjectStore('plugins', {autoIncrement : true})
    // db.createObjectStore('channels', {autoIncrement : true})
  }

  // Utilities
  let $ = (selector, fragment) => fragment.querySelector(selector)
  let $$ = (selector, fragment) => fragment.querySelectorAll(selector)
  let setVal = file => file.text().then(txt => (_code.value = txt)).catch(()=>{alert(1)})
  let stop = evt => evt && evt.stopPropagation(evt.preventDefault())
  let filesDroped = evt => setVal(evt.dataTransfer.files[0], stop(evt))

  /**
   * Load all plugins
   */
  let plugins = yield new Promise(rs => {
    let request = indexedDB.open('tv', 1)
    var items = []

    request.onerror = event => {}
    request.onupgradeneeded = onupgradeneeded
    request.onsuccess = evt => {
      let db = evt.target.result
      let store = db.transaction('plugins', 'readwrite').objectStore('plugins')
      let cursorRequest = store.openCursor()
      cursorRequest.onerror = console.error
      cursorRequest.onsuccess = evt => {
        let cursor = evt.target.result
        if (cursor) {
          items.push(cursor.value)
          cursor.continue()
        } else {
          rs(items)
        }
      }
    }
  })

  yield Promise.all(plugins.map(p => app.load(p.code)))

  function displayContent(evt, content) {
    stop(evt)
    $overview.innerHTML = ''

    app.get(location.pathname).then(res => {
      let fragment = new DocumentFragment
      let content = $linkItem.content
      let a = content.querySelector('a')
      let poster = content.querySelector('.poster')

      if (res.data.video) {
        let video = document.createElement('video')
        video.controls = true
        video.className = 'video-js vjs-default-skin'
        $overview.appendChild(video)
        let player = videojs(video, {
          plugins: { airplayButton: {} }
        })
        player.fluid(true)
        player.qualityLevels()
        player.src(res.data.video.source)
        player.poster(res.data.video.poster)
        window.player = player
      }

      if (res.data.links) {
        for (let link of res.data.links) {
          poster.style.backgroundImage = `url(${link.poster})`
          a.innerText = link.title
          a.href = '/' + res.plugin + link.src
          fragment.appendChild(document.importNode($linkItem.content, true))
        }
      }
      $overview.appendChild(fragment)
    })
  }

  app.loadPlugin = evt => setVal(evt.target.files[0])

  app.loadPluginPage = evt => {
    stop(evt)

    var fragment = new DocumentFragment()
    fragment.appendChild(document.importNode($pluginForm.content, true))

    let a = $('a', $pluginItem.content)
    let {content} = $pluginItem

    for (let plugin of plugins) {
      a.innerText = plugin.name
      a.href = `/${plugin.name}/`
      fragment.appendChild(document.importNode(content, true))
    }

    $overview.innerHTML = ''
    $overview.appendChild(fragment)
  }

  app.loadHomePage = evt => {
    stop(evt)
    $overview.innerHTML = ''

    for (let plugin of plugins) {
      app.get(`/${plugin.name}/`).then(res => {
        let fragment = new DocumentFragment
        let content = $linkItem.content
        let a = content.querySelector('a')
        let poster = content.querySelector('.poster')
        let container = document.importNode($horizontalMenu.content, true)
        let section = $('ul', container)
        $('h3', container).innerText = plugin.name

        for (let link of res.data.links) {
          poster.style.backgroundImage = `url(${link.poster})`
          a.innerText = link.title
          a.href = '/' +plugin.name + link.src
          section.appendChild(document.importNode($linkItem.content, true))
        }
        $overview.appendChild(container)
      })
    }
  }

  app.addPlugin = async(function* (evt) {
    stop(evt)
    let code = evt.target.elements.code.value
    let url

    if (code.match(URL_REGEXP)) {
      url = code
      code = yield fetch(code).then(res => res.text())
      console.log(code)
    }

    let res = yield app.load(code)

    if (res.ok) {
      yield new Promise((rs, rj) => {
        let request = indexedDB.open('tv', 1)
        request.onupgradeneeded = onupgradeneeded
        request.onsuccess = evt => {
          let db = evt.target.result
          let store = db.transaction('plugins', 'readwrite').objectStore('plugins')
          let plugin = {name: res.data.name, code, url}
          plugins.push(plugin)
          store.add(plugin).onsuccess = () => rs()
        }
      })
      app.loadPluginPage()
    }
  })

  let nav = () => {
    switch (location.pathname) {
      case '/': app.loadHomePage(); break;
      case '/plugins': app.loadPluginPage(); break;
      default: displayContent(); break;
    }
  }

  document.onclick = evt => {
    if (evt.target.matches('a')) {
      history.pushState({}, 'fff', evt.target.href)
      nav(stop(evt))
    }
  }

  window.onpopstate = nav; nav()

}))();
