{
  const secret = Symbol()
  const find = /[!'\(\)~]|%20|%00/g
  const plus = /\+/g
  const replace = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  }
  const replacer = match => replace[match]

  function encode(str) {
    return encodeURIComponent(str).replace(find, replacer)
  }

  function decode(str) {
    return decodeURIComponent(str.replace(plus, ' '))
  }

  window.URLSearchParams = class URLSearchParams {

    constructor(query) {
      this[secret] = Object.create(null)

      if (!query) return

      if (typeof query === 'string') {
        if (query.charAt(0) === '?')
          query = query.slice(1)

        for (let value of query.split('&')) {
          let index = value.indexOf('=')

          if (-1 < index) {
            this.append(
              decode(value.slice(0, index)),
              decode(value.slice(index + 1))
            )
          } else if (value.length) {
            this.append(decode(value), '')
          }
        }
      } else if (query[Symbol.iterator] === 'function') {
        for (let pair of query)
          this.append(...pair)
      } else {
        for (let pair of Object.entries(query))
          this.append(...pair)
      }
    }

    append(name, value) {
      const dict = this[secret];
      if (name in dict) {
        dict[name].push(value + '')
      } else {
        dict[name] = [value + '']
      }
    }

    delete(name) {
      delete this[secret][name]
    }

    get(name) {
      const dict = this[secret]
      return name in dict ? dict[name][0] : null
    }

    getAll(name) {
      const dict = this[secret]
      return name in dict ? dict[name].slice(0) : []
    }

    has(name) {
      return name in this[secret]
    }

    set(name, value) {
      this[secret][name] = [value + '']
    }

    forEach(callback, thisArg) {
      [...this].forEach(callback, thisArg)
    }

    keys() {
      return Object.keys(this[secret])[Symbol.iterator]()
    }

    values() {
      return [].concat(...Object.values(this[secret]))[Symbol.iterator]()
    }

    *entries() {
      for(let [key, items] of Object.entries(this[secret])) {
        for (let n of items) {
          yield [key, n]
        }
      }
    }

    sort() {
      var sorted = [...this].sort((a, b) =>
        a[0] < b[0] ? -1 :
        a[0] > b[0] ? 1 : 0
      )
      this[secret] = Object.create(null)
      sorted.forEach(a => this.append(...a))
    }

    toJSON() {
      return {}
    }

    [Symbol.iterator]() {
      return this.entries()
    }

    toString() {
      const dict = this[secret]
      const query = []

      for (let key in dict) {
        let name = encode(key);
        for (let value of dict[key]) {
          query.push(`${name}=${encode(value)}`)
        }
      }
      return query.join('&')
    }
  }
}
