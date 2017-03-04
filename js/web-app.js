'use strict'

;(async(function* (){
  // Regex to test if code is a url and only one line...



  // Utilities
  let $ = (selector, fragment) => fragment.querySelector(selector)
  let $$ = (selector, fragment) => fragment.querySelectorAll(selector)
  let setVal = file => file.text().then(txt => (_code.value = txt)).catch(()=>{alert(1)})
  let stop = evt => evt && evt.stopPropagation(evt.preventDefault())
  let {plugins} = yield app.getPlugins
  app.filesDroped = evt => setVal(evt.dataTransfer.files[0], stop(evt))

  yield Promise.all(plugins.map(p => app.load(p.code, p.storage)))

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
    let del = $('button', $pluginItem.content)
    let {content} = $pluginItem

    for (let plugin of plugins) {
      del.dataset.name = a.innerText = plugin.name
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

  app.submitPlugin = evt => {
    stop(evt)
    app.addPlugin(evt.target.elements.code.value).then(res => {
      res.ok ? app.loadPluginPage() : alert(res.data.message)
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
    if (evt.target.matches('a')) {
      history.pushState({}, 'fff', evt.target.href)
      nav(stop(evt))
    }
  }

  window.onpopstate = nav; nav()

}))();
