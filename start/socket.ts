/*
|--------------------------------------------------------------------------
| Attach socket.io to Adonis HTTP server
|--------------------------------------------------------------------------
|
| This preload attaches a Socket.IO server to the underlying Node HTTP
| server used by Adonis. It exports the `io` instance for other modules
| to import if needed.
|
*/

import server from '@adonisjs/core/services/server'
import { Server as IOServer } from 'socket.io'

// Try common property names to find underlying HTTP server
const httpServer: any = (server as any).instance || (server as any).getInstance?.() || (server as any).httpServer

let io: any

function attach(srv: any) {
  if (!srv) {
    console.warn('Socket.IO: no HTTP server found to attach to')
    return
  }

  io = new IOServer(srv, {
    cors: { origin: '*' },
  })

  io.on('connection', (socket: any) => {
    console.log('New WS connection:', socket.id)

    socket.on('hello', (msg: string) => {
      console.log('hello from', socket.id, msg)
      socket.emit('hello:response', 'hi')
    })

    socket.on('disconnect', (reason: any) => {
      console.log('disconnect', socket.id, reason)
    })
  })
}

if (httpServer) {
  attach(httpServer)
} else {
  // Defer attaching for the rare case the server isn't ready yet
  setImmediate(() => {
    const srv = (server as any).instance || (server as any).getInstance?.() || (server as any).httpServer
    attach(srv)
  })
}

export default io
