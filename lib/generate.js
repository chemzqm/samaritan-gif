var fs = require('fs')
var PI = Math.PI
var Canvas = require('canvas')
var Parallel = require('node-parallel')
var tmp = require('tmp')
var exec = require('child_process').exec
var path = require('path')
var uid = require('uid')
var random_str = 'quarbawefcdonsdjge'

function toRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function toRgba (hex, alpha) {
  var rgb = toRgb(hex)
  return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ','  + alpha + ')'
}

function drawBackground(ctx, text, opt) {
  ctx.fillStyle = opt.background
  ctx.fillRect(0, 0, opt.width, opt.height)
}

function createStartFrames(word) {
  var frames = []
  var total = 3
  for (var i = 0; i <= total; i ++) {
    frames.push({
      text: word,
      start: true,
      wordIndex: 0,
      percent: 0.5 + 0.5*i/total
    })
  }
  return frames
}

function drawFirstFrame(ctx, word, opt) {
  ctx.font = opt.fontSize + 'px MagdaCleanMono'
  var space = String.fromCharCode(8201)
  var text = random_str.slice(0, word.length).split("").join(space)
  var tw = ctx.measureText(text).width
  ctx.fillStyle = opt.color

  var x = opt.width/2 - tw/2
  var arr = []
  for (var i = 0; i < text.length; i ++) {
    var c = text[i]
    if (c === space) continue
    arr.push({
      text: c,
      x: x + ctx.measureText(text.slice(0, i)).width
    })
  }
  var size = Math.floor(opt.fontSize/2)
  ctx.font = size + 'px MagdaCleanMono'
  arr.forEach(function (o) {
    ctx.fillText(o.text, o.x, opt.height/2 - size/2)
  })
  // line
  ctx.strokeStyle = opt.color
  ctx.beginPath()
  var y = opt.height/2 + 3
  ctx.moveTo(x, y)
  ctx.lineTo(x + tw, y)
  ctx.stroke()
  // triangle
  drawTriangle(ctx, 0.5, opt)
}

function drawEndFrame(ctx, frame, opt) {
  ctx.font = opt.fontSize + 'px Fira Mono'
  var texts = opt.text.split(/\s+/)
  var last = texts[texts.length - 1]
  var tw = ctx.measureText(last).width
  var indent = texts.length%2 == 0 ? 0 : 8
  var d = (tw * frame.num/3)/2
  var sx = opt.width/2 - tw/2 + indent + d
  var ex = opt.width/2 + tw/2 + indent - d
  ctx.strokeStyle = opt.color
  ctx.beginPath()
  var y = opt.height/2 + 3
  ctx.moveTo(sx, y)
  ctx.lineTo(ex, y)
  ctx.stroke()
  var alpha = 1 - frame.num/3
  drawTriangle(ctx, alpha, opt)
}

function drawText(ctx, frame, opt) {
  if (frame.end) return
  ctx.font = opt.fontSize + 'px MagdaCleanMono'
  var text = frame.text.split("").join(String.fromCharCode(8201))
  var indent = frame.wordIndex%2 == 0 ? 0 : 8
  var te = ctx.measureText(text)
  ctx.fillStyle = opt.color
  var x = opt.width/2 - te.width/2 + indent
  ctx.fillText(text, x, opt.height/2)
  ctx.strokeStyle = opt.color
  ctx.beginPath()
  var y = opt.height/2 + 3
  ctx.moveTo(x, y)
  ctx.lineTo(x + te.width, y)
  ctx.stroke()
}

function drawStartText(ctx, frame, opt) {
  ctx.font = opt.fontSize + 'px MagdaCleanMono'
  var space = String.fromCharCode(8201)
  var text = frame.text.split("").join(space)
  var m = Math.floor(text.length/2)
  var start = text.slice(0, m)
  var end = text.slice(m)
  var tw = ctx.measureText(text).width
  var sw = ctx.measureText(start).width
  ctx.fillStyle = opt.color
  var x = opt.width/2 - tw/2
  ctx.fillText(start, x, opt.height/2)
  if (frame.percent) {
    // draw end part
    var arr = []
    for (var i = 0; i < end.length; i ++) {
      var c = end[i]
      if (c === space) continue
      var d = (opt.fontSize - opt.fontSize*frame.percent)/2
      arr.push({
        text: c,
        x: x + sw + ctx.measureText(end.slice(0, i)).width + d
      })
    }
    var size = opt.fontSize * frame.percent
    ctx.font = Math.floor(size) + 'px MagdaCleanMono'
    arr.forEach(function (o) {
      ctx.fillText(o.text, o.x, opt.height/2)
    })
  }
  // line
  ctx.strokeStyle = opt.color
  ctx.beginPath()
  var y = opt.height/2 + 3
  ctx.moveTo(x, y)
  ctx.lineTo(x + tw, y)
  ctx.stroke()
}

function drawTriangle(ctx, alpha, opt) {
  var x = opt.width/2
  var y = opt.height/2 + 5
  var len = opt.fontSize * 0.8
  var color = toRgba('#E11223', alpha)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - len*Math.cos(PI/3), y + len*Math.sin(PI/3))
  ctx.lineTo(x + len*Math.cos(PI/3), y + len*Math.sin(PI/3))
  ctx.closePath()
  ctx.fill()
}

function pad(i) {
  var str = String(i)
  if (str.length == 2) return str
  return '0' + str
}

function drawFrame(config, frame, cb) {
  var canvas = new Canvas(config.width, config.height)
  var stream = canvas.pngStream()
  var out = fs.createWriteStream(config.path + '/s' + pad(frame.index) + '.png')
  stream.pipe(out)
  var called
  stream.on('error', function (err) {
    called = true
    cb(err)
  })
  out.on('finish', function () {
    if (!called) cb()
  })
  var ctx = canvas.getContext('2d');
  drawBackground(ctx, frame.text, config)
  if (frame.index == 0) {
    drawFirstFrame(ctx, frame.text, config)
  } else if (frame.end) {
    drawEndFrame(ctx, frame, config)
  } else {
    if (frame.start) {
      drawStartText(ctx, frame, config)
    } else {
      drawText(ctx, frame, config)
    }
    drawTriangle(ctx, frame.opacity, config)
  }
}

var draw = module.exports = function (config, cb) {
  var fps = 20
  var texts = config.text.split(/\s+/)
  // 0.5s per word
  var total = texts.length*fps/2
  var frames = createStartFrames(texts[0])
  for (var i = 0; i < total; i++) {
    var wordIndex = Math.floor(i/10)
    var text = texts[wordIndex]
    frames.push({
      text: text,
      wordIndex: wordIndex
    })
  }
  for (var i = 1; i <= 6; i ++) {
    frames.push({
      end: true,
      num: i
    })
  }
  tmp.dir({mode: 0750, prefix: uid(8)}, function (err, dir) {
    if (err) return cb(err)
    config.path = dir
    var p = new Parallel()
    frames.forEach(function (frame, i) {
      var d = i%20
      frame.opacity = 1 *(Math.abs(d - 10)/10)
      frame.index = i
      p.add(function (done) {
        drawFrame(config, frame, done)
      })
    })
    p.done(function (err) {
      if (err) return cb(err)
      exec('convert -delay 5 -loop 0 *.png animates.gif', {cwd: dir}, function (err) {
        if (err) return cb(err)
        var dest = path.resolve(__dirname, '../public/images', uid(8) + '.gif')
        exec('mv ' + dir + '/animates.gif ' + dest, function (err) {
          if (err) return cb(err)
          cb(err, dest)
        })
      })
    })
  })
}
