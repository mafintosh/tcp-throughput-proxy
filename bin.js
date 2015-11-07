#!/usr/bin/env node

var net = require('net')
var minimist = require('minimist')
var speedometer = require('speedometer')
var log = require('single-line-stream')
var pretty = require('pretty-bytes')
var pump = require('pump')

var argv = minimist(process.argv.slice(2), {
  alias: {from: 'f', monitor: 'm', help: 'h', to: 't'}
})

if (argv.help) {
  console.error(
    'Usage: tcp-throughput-proxy [options]\n' +
    '  --from, -f     [port]\n' +
    '  --to, -t       [host:port]\n' +
    '  --monitor, -m  [from-port + 1]\n'
  )
  process.exit(0)
}

var proxyPort = 0
var proxyHost = null

if (argv.to) {
  proxyPort = typeof argv.to === 'number' ? argv.to : argv.to.split(':')[1]
  proxyHost = typeof argv.to === 'number' ? '127.0.0.1' : argv.to.split(':')[0]
}

if (!argv.from) argv.from = proxyPort || 10000
if (!argv.monitor) argv.monitor = argv.from + 1

var receiving = speedometer()
var sending = argv.to ? speedometer() : null
var connections = 0

var server = net.createServer(function (socket) {
  if (proxyPort) pump(socket, net.connect(proxyPort, proxyHost).on('data', onsend), socket)
  connections++
  socket.on('end', onend)
  socket.on('error', onerror)
  socket.on('close', onclose)
  socket.on('data', onreceive)
})

var monitor = net.createServer(function (socket) {
  socket.on('end', onend)
  socket.on('error', onerror)

  var stream = log()
  var interval = setInterval(progress, 500)
  stream.pipe(socket)

  socket.on('close', function () {
    clearInterval(interval)
  })

  function progress () {
    stream.write(
      connections + ' open connections\n' +
      'Receiving ' + pretty(receiving()) + '/s\n' +
      (sending ? 'Sending ' + pretty(sending()) + '/s\n' : '')
    )
  }
})

monitor.listen(argv.monitor, function () {
  server.listen(argv.from, function () {
    if (argv.to) console.log('Proxing to %s from %d', proxyHost + ':' + proxyPort, argv.from)
    else console.log('Server is listening on %d', argv.from)
    console.log('Monitor server is listening on %d', argv.monitor)
  })
})

function onreceive (data) {
  receiving(data.length)
}

function onsend (data) {
  sending(data.length)
}

function onclose () {
  connections--
}

function onerror () {
  this.destroy()
}

function onend () {
  this.end()
}
