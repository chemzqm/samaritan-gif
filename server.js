var fs = require('fs')
var koa = require('koa')
var app = koa();
var path = require('path')
var root = path.resolve(__dirname, 'public')
var generate = require('./lib/generate')
var getRawBody = require('raw-body')
app.use(require('koa-static')(root))

function genPromise(query) {
  return new Promise(function (resolve, reject) {
    var o = {}
    Object.keys(query).forEach(function (k) {
      if (['width', 'height', 'fontSize']. indexOf(k) !== -1) {
        o[k] = parseInt(query[k])
      } else {
        o[k] = query[k]
      }
    })
    generate(o, function (err ,dest) {
      if (err) return reject(err)
      resolve(dest)
    })
  })
}

var arr = ['width', 'height', 'text', 'color', 'background', 'fontSize']
var public_dir = path.resolve(__dirname, 'public')

function checkParams(query) {
  for (var i = 0, l = arr.length; i < l; i++) {
    var name = arr[i]
    if (!query[name]) return name  + ' is required'
    if (['width', 'height', 'fontSize'].indexOf(name) !== -1) {
      if (!parseInt(query[name])) return name + ' should be number'
    }
    if (name == 'text' && query[name].length > 40) return name + ' should not too long'
    if (name == 'text' && !/^[\w\s]*$/.test) return 'only english words and white space allowed for text'
  }
}

app.use(function * () {
  if (this.path == '/return_url') {
    var o = {
      method: this.method,
      query: this.query,
      body: getRawBody(this.req, {
        length: this.length,
      limit: '1mb',
      encoding: this.charset
      })
    }
    yield this.recordRequest(o)
  } else if (this.path == '/generate' && this.method == 'GET') {
    var msg = checkParams(this.query)
    if (msg) {
      this.throw(400, msg)
    } else {
      var dest = yield genPromise(this.query)
      dest = path.relative(public_dir, dest)
      this.body = JSON.stringify({dest: dest})
    }
  }
})

function recordRequest(o) {
  return Promise(function (resolve, reject) {
    fs.writeFile('/home/chemzqm/return.txt', JSON.stringify(o), 'utf8', function (err) {
      if (err) return reject(err)
      resolve()
    })
  })
}

var port = process.env.PORT || 3000
app.listen(port, '127.0.0.1')
