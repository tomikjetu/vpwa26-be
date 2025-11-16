import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server as IOServer } from 'socket.io'
import SocketChannelsController from '#controllers/socket_channels_controller'
import Session from '#models/session'
import { DateTime } from 'luxon'

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

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      // Validate token against sessions table
      const session = await Session.query()
        .where('access_token', token)
        .preload('user')
        .first()

      if (!session) {
        return next(new Error('Authentication error: Invalid token'))
      }

      // Check expiration
      if (session.expiresAt && session.expiresAt < DateTime.now()) {
        return next(new Error('Authentication error: Token expired'))
      }

      // Attach user to socket
      ;(socket as any).user = session.user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  const channelsController = new SocketChannelsController()

  io.on('connection', async (socket) => {
    console.log('New WS connection:', socket.id)
    
    const user = (socket as any).user
    if (user) {
      // Join user-specific room for private notifications
      socket.join(`user:${user.id}`)
      
      // Join all channels the user is a member of
      const Member = (await import('#models/member')).default
      const members = await Member.query().where('user_id', user.id).select('channel_id')
      members.forEach((member) => {
        socket.join(`channel:${member.channelId}`)
      })
    }
    
    // Send all available channels to the connected user
    channelsController.sendAllChannels(socket, io!)

    // Handle channel creation
    socket.on('channel:create', (data: { name: string; isPrivate?: boolean }) => {
      channelsController.createChannel(socket, io!, data)
    })

    socket.on('disconnect', (reason) => {
      console.log('disconnect', socket.id, reason)
    })
  })

  console.log('Socket.IO server attached successfully')
})

export { io }
export default io
