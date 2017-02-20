/**
 * Forked from https://github.com/github/fetch to support
 * Stream API
 */

'use strict'

;((self) => {

  if (self.fetch)
    return

  // HTTP methods whose capitalization should be normalized
  const methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
  const parseResponse = testResType('moz-chunked-arraybuffer') ? mozParser : defaultParser
  const redirectStatuses = [301, 302, 303, 307, 308]

  function mozParser(xhr, controller) {
    xhr.responseType = 'moz-chunked-arraybuffer'
    xhr.onprogress = function () {
      controller.enqueue(new Uint8Array(xhr.response))
    }
  }

  /* Don't have IE
  function msParser(xhr, controller) {
    // only avalible on stage 3?
    var msstream = xhr.response // MSStream object
    var stream = msstream.msDetachStream() // IInputStreamObject

    var reader = new MSStreamReader()
    reader.onprogress = function () {
      // enqueue chunk (Uint8Array) to ReadableStream
      controller.enqueue(new Uint8Array(reader.result))
    }

    reader.readAsArrayBuffer(msstream) // or
    reader.readAsArrayBuffer(stream)
  }
  */

  function asciiToBytes(str) {
    let len = str.length
    let byteArray = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray[i] = str.charCodeAt(i) & 0xFF
    }

    return byteArray
  }

  function defaultParser(xhr, controller) {
    var offset = 0

    xhr.responseType = 'text'
    // Don't let browser modify the response text
    xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.onprogress = () => {
      let chunk = xhr.response.substr(offset)
      let buffer = asciiToBytes(chunk)
      offset = xhr.response.length
      controller.enqueue(new Uint8Array(buffer))
    }
    xhr.onload = () => {
      xhr.onprogress()
      controller.close()
    }
  }

  function testResType(type) {
    /* IE throws on setting responseType to an unsupported value */
    try {
      let xhr = new XMLHttpRequest
      return 'responseType' in xhr && (xhr.responseType = type) === xhr.responseType
    } catch (err) {
      return false
    }
  }

  function normalizeName(name) {
    name += ''

    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name))
      throw new TypeError('Invalid character in header field name')

    return name.toLowerCase()
  }

  function formData2blob(fd) {
    let boundary = '----FormData' + Math.random()
    let chunks = []

    for (let [key, value] of fd) {
      chunks.push(`--${boundary}\r\n`)

      if (value instanceof File) {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"; filename="${value.name}"\r\n`,
          `Content-Type: ${value.type}\r\n\r\n`,
          value,
          '\r\n'
        )
      } else {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
        )
      }
    }

    chunks.push(`--${boundary}--`)

    return new Blob(chunks, {type: 'multipart/form-data; boundary=' + boundary})
  }

  function concatenate(arrays) {
    let size = arrays.reduce((a,b) => a + b.byteLength, 0)
    let result = new Uint8Array(size)
    let offset = 0

    for (let arr of arrays) {
      result.set(arr, offset)
      offset += arr.byteLength
    }

    return result
  }

  function concatStream(res) {
    if (res.bodyUsed)
      return Promise.reject(new TypeError('Already read'))

    if (res.body && res.body.locked)
      return Promise.reject(new TypeError('Body is locked to a reader'))

    if (!res.body)
      return Promise.resolve(new Uint8Array([]))

    let chunks = []
    let reader = res.body.getReader()
    let pump = () => reader.read().then(result => {
      if (!result.done) {
        chunks.push(result.value)
        return pump()
      }
    })

    res.bodyUsed = true

    return pump().then(() => concatenate(chunks))
  }

  function initBody(klass, body) {
    let content = !klass.headers.get('content-type')
    let bytes

    // Don't use strict equal. undefined and null should result in null
    if (body == null)
      return klass.body = null

    if (body instanceof Blob) {
      content && body.type && klass.headers.set('content-type', body.type)
      klass.body = body.slice().stream()
    } else if (body instanceof FormData) {
      body = formData2blob(body)
      content && klass.headers.set('content-type', body.type)
      klass.body = body.slice().stream()
    } else if (body instanceof URLSearchParams) {
      content && klass.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      bytes = asciiToBytes(body+'')
    } else if (body.getReader) {
      klass.body = body
    } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      bytes = new Uint8Array(body.slice())
    } else {
      // Rest is converted to a string
      content && klass.headers.set('content-type', 'text/plain;charset=UTF-8')
      bytes = asciiToBytes(body+'')
    }

    if (bytes) {
      klass.body = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes)
          controller.close()
        },
        pull() {
          klass.bodyUsed = true
        }
      })
    }
  }

  function Body() {
    this.bodyUsed = false

    this.arrayBuffer = () => concatStream(this).then(buffer => buffer.buffer)
    this.blob = () => concatStream(this).then(buffer => new Blob([buffer]))
    this.json = () => this.text().then(JSON.parse)
    this.text = () => concatStream(this).then(buffer =>
      String.fromCharCode(...new Uint16Array(buffer))
    )

    return this
  }

  function normalizeMethod(method) {
    let upcased = method.toUpperCase()
    return methods.includes(upcased) ? upcased : method
  }

  class Request extends Body {
    constructor(input, options = {}) {
      super()

      var body = options.body
      if (input instanceof Request) {
        if (input.bodyUsed) {
          throw new TypeError('Already read')
        }
        this.url = input.url
        this.credentials = input.credentials
        if (!options.headers) {
          this.headers = new Headers(input.headers)
        }
        this.method = input.method
        this.mode = input.mode
        if (!body && input.body) {
          let dummyStream = new ReadableStream
          let reader = dummyStream.getReader()
          reader.read()
          body = input.body
          input.body = dummyStream
          input.bodyUsed = true
        }
      } else {
        this.url = input
      }

      this.credentials = options.credentials || this.credentials || 'omit'

      if (options.headers || !this.headers)
        this.headers = new Headers(options.headers || {})

      this.method = normalizeMethod(options.method || this.method || 'GET')
      this.mode = options.mode || this.mode || null
      this.referrer = null

      if ((this.method === 'GET' || this.method === 'HEAD') && body) {
        throw new TypeError('Body not allowed for GET or HEAD requests')
      }

      initBody(this, body)
    }

    clone() {
      let body = null

      if (this.body) {
        let tee = this.body.tee()
        this.body = tee[0]
        body = tee[1]
      }

      return new Request(this, {body})
    }

    [Symbol.toStringTag]() {
      return 'Request'
    }
  }

  function parseHeaders(rawHeaders) {
    let headers = new Headers

    for (let line of rawHeaders.split(/\r?\n/)) {
      let parts = line.split(':')
      let key = parts.shift().trim()

      if (key)
        headers.append(key, parts.join(':').trim())
    }

    return headers
  }

  class Response extends Body {
    constructor (bodyInit, options = {}) {
      super()

      this.type = 'default'
      this.status = options.status || 200
      this.ok = this.status >= 200 && this.status < 300
      this.statusText = options.statusText || 'OK'
      this.headers = new Headers(options.headers || {})
      this.url = options.url || ''

      initBody(this, bodyInit)
    }

    clone() {
      var body = null

      if (this.body) {
        var tee = this.body.tee()
        this.body = tee[0]
        body = tee[1]
      }

      return new Response(body, {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers(this.headers),
        url: this.url
      })
    }

    static error() {
      var response = new Response(null, {status: 0, statusText: ''})
      response.type = 'error'
      return response
    }

    static redirect(location, status) {
      if (!redirectStatuses.includes(status))
        throw new RangeError('Invalid status code')

      return new Response(null, {status, headers: {location}})
    }

    [Symbol.toStringTag]() {
      return 'Response'
    }
  }


  self.Request = Request
  self.Response = Response

  self.fetch = (input, init) => {
    return new Promise((resolve, reject) => {
      let request = input instanceof Request && !init
        ? input
        : new Request(input, init)

      let xhr = new XMLHttpRequest
      let rs = new ReadableStream({
        start(controller) {
          parseResponse(xhr, controller)
        },
        cancel() {
          xhr.abort()
        }
      })

      xhr.onreadystatechange = () => {
        if (xhr.readyState === xhr.HEADERS_RECEIVED) {
          resolve(new Response(rs, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
            url: xhr.responseURL
          }))
        }
      }

      xhr.onerror = () => reject(new TypeError('Network request failed'))
      xhr.ontimeout = () => reject(new TypeError('Network request failed'))
      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include')
        xhr.withCredentials = true

      for (let [value, name] of request.headers)
        xhr.setRequestHeader(name, value)

      request.body
        ? request.blob().then(blob => xhr.send(blob))
        : xhr.send()
    })
  }
  self.fetch.polyfill = true
})(this);
