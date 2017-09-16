/*
class Emitter {
  constructor() {
    const delegate = document.createDocumentFragment();
    ['addEventListener', 'dispatchEvent', 'removeEventListener'].forEach(f =>
      this[f] = (...xs) => delegate[f](...xs)
    )
  }
}

class ModularVideo extends Emitter {
  constructor(wrapper) {
    super()

    wrapper.classList.add('idle', 'mv')
    wrapper.instance = this
    this.playlist = []
    this.sessions = []
  }

  set controls(boolean) {
    if (boolean) {
      this.wrapper.setAttribute('controls', '')
    } else {
      this.wrapper.removeAttribute('controls')
    }
  }

  get controls() {
    return this.wrapper.hasAttribute('controls')
  }

  async play() {
    const sessions = this.sessions.filter(session => session.active)
    const promises = sessions.map(session => session.play())

    await Promise.all(promises)
  }

  pause() {

  }

  static addRenderByMime() {
  }

  static addRenderByExtension() {
  }
}

ModularVideo.prototype.error = null
*/
