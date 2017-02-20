const secret = Symbol('secret')
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

class URLSearchParams {

  constructor(query) {
    this[secret] = Object.create(null)

    if (!query) return

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

  toJSON() {
    return {}
  }

  [Symbol.iterator]() {
    return this.entries()
  }

  toString() {
    const dict = this[secret]
    const query = []
    let i, key, name, value

    for (key in dict) {
      name = encode(key);
      for (i = 0, value = dict[key]; i < value.length; i++) {
        query.push(`${name}=${encode(value[i])}`)
      }
    }
    return query.join('&')
  }
}
