;(() => {
  'use strict'

  importScripts('/js/libs/sw-toolbox.js')

  let {router} = toolbox

  self.oninstall = event => event.waitUntil(
    caches.open('v1').then(cache => {
      return Promise.all([
        cache.add('https://fonts.googleapis.com/icon?family=Material+Icons')
      ])
    })
  )

  router.default = async request => {
    let url = new URL(request.url)

    if (url.protocol == 'http:' && url.hostname !== 'localhost')
      url.protocol = 'https:'

    if (request.headers.get('accept').includes('text/html'))
      return fetch('/views/index.html')

    return fetch(url, request)
  }

})();
