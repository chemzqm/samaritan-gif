var request = require('request-component')
var Notice = require('notice')
var Wander = require('loadings/lib/wander')
var loading = document.querySelector('.loading')
var wander

var fields = ['width', 'height', 'text', 'color', 'background', 'fontSize']

var ratio = window.devicePixelRatio
var btn = document.getElementById('submit')
var form = document.getElementById('form')
form.addEventListener('submit', function (e) {
  if (btn.disabled) return
  e.preventDefault()
  var data = {}
  fields.forEach(function (name) {
    data[name] = document.querySelector('[name="' + name + '"]').value
  })
  var msg = checkParams(data)
  if (msg) {
    Notice(msg, { type: 'error' })
    return
  }
  data.width = data.width * ratio
2
  data.height = data.height * ratio
  data.fontSize = data.fontSize * 2

  btn.disabled = true
  loading.style.display = 'block'
  if (!wander) {
    wander = Wander(loading, {
      color: '#EC1F00'
    })
  }
  request.get(form.action, data, function (err, res) {
    btn.disabled = false
    if (err) return Notice(err.message, { type: 'error' })
    if (res.status !== 200) return Notice('request error status:' + res.status, {type: 'error'})
    var img = document.createElement('img')
    img.onload = function () {
      document.getElementById('share').style.display = 'block'
      loading.style.display = 'none'
    }
    img.width = data.width/ratio
    img.height = data.height/ratio
    img.src = JSON.parse(res.text).dest
    var result = document.getElementById('result')
    result.innerHTML = ''
    result.appendChild(img)
    result.scrollIntoView()
  })
}, false)

function checkParams(query) {
  for (var i = 0, l = fields.length; i < l; i++) {
    var name = fields[i]
    if (!query[name]) return name  + ' is required'
    if (['width', 'height', 'fontSize'].indexOf(name) !== -1) {
      if (!parseInt(query[name])) return name + ' should be integer'
    }
    if (name == 'text' && query[name].length > 40) return name + ' should not too long'
    if (name == 'text' && !/^[\w\s]*$/.test) return 'only english words and white space allowed for text'
  }
}
