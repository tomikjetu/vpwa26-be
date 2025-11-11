import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server as IOServer } from 'socket.io'
import SocketMessagesController from '#controllers/socket_messages_controller'

let io: IOServer | undefined

app.ready(() => {
  const nodeServer = server.getNodeServer()

  if (!nodeServer) {
    console.warn('Socket.IO: no HTTP server found to attach to')
    return
  }

  io = new IOServer(nodeServer, {
    cors: { origin: '*' },
  })

  const messagesController = new SocketMessagesController()

  io.on('connection', (socket) => {
    console.log('New WS connection:', socket.id)

    socket.on('channel:messages', (data: { channelId: number | string }) => {
      messagesController.getChannelMessages(socket, data)
    })

    socket.on('disconnect', (reason) => {
      console.log('disconnect', socket.id, reason)
    })
  })

  console.log('Socket.IO server attached successfully')
})

export { io }
export default io
