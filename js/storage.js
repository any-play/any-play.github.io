var store = Object.create(null)

class Storage {
  getItem(sKey) {
    return this.hasItem(sKey) ? store[sKey] : null
  }
  setItem(sKey, sValue) {
    store[sKey] = sValue
    return true
  }
  removeItem(sKey) {
    if (!this.hasItem(sKey)) return false
    delete store[sKey]
    return true
  }
  // hasItem(sKey) {
  //   if (!sKey) return false
  //   return sKey in store
  // }
  keys() {
    return Object.keys(store)
  }
  get length() {
    return Object.keys(store).length
  }
  clear() {
    store = Object.create(null)
  }
  key(n) {
    return Object.keys(store)[n]
  }
}

var storage = new Proxy(new Storage, {
  get(oTarget, sKey) {
    return oTarget[sKey] || oTarget.getItem(sKey) || undefined
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
