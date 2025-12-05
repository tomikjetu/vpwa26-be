import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server as IOServer } from 'socket.io'

import ChannelsController from '#controllers/channels_controller'
import InvitesController from '#controllers/invites_controller'
import MessagesController from '#controllers/messages_controller'
import UsersSocketController from "#controllers/users_controller"

import Session from '#models/session'
import { DateTime } from 'luxon'
import { NotifStatus, UserStatus } from 'types/string_literals.js'

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

  // ────────────────────────────────────────────────────────────────
  // AUTH MIDDLEWARE
  // ────────────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const session = await Session.query()
        .where('access_token', token)
        .preload('user')
        .first()

      if (!session) {
        return next(new Error('Authentication error: Invalid token'))
      }

      if (session.expiresAt && session.expiresAt < DateTime.now()) {
        return next(new Error('Authentication error: Token expired'))
      }

      ;(socket as any).user = session.user
      next()

    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication error'))
    }
  })

  // ────────────────────────────────────────────────────────────────
  // CONTROLLERS
  // ────────────────────────────────────────────────────────────────
  const channelsController = new ChannelsController()
  const invitesController = new InvitesController()
  const messagesController = new MessagesController()
  const usersController = new UsersSocketController()

  // ────────────────────────────────────────────────────────────────
  // CONNECTION HANDLER
  // ────────────────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    console.log('New WS connection:', socket.id)

    const user = (socket as any).user
    
    if (user) {
      // Join user personal notification room
      socket.join(`user:${user.id}`)

      // Mark user as connected in database
      user.isConnected = true
      await user.save()

      // Join all channels user is in
      const Member = (await import('#models/member')).default
      const members = await Member.query().where('user_id', user.id).select('channel_id')

      members.forEach((member) => {
        socket.join(`channel:${member.channelId}`)
      })

      // Broadcast connection state to all users who share a channel
      await usersController.broadcastUserState(io!, user.id, user.status, true)

      usersController.me(socket)      
      channelsController.listChannels(socket)
      invitesController.list(socket)
    }

    // ────────────────────────────────────────────────────────────────
    // CHANNEL EVENTS
    // ────────────────────────────────────────────────────────────────

    socket.on('channel:list', () => 
      channelsController.listChannels(socket)
    )

    socket.on('channel:create', (data: { name: string; isPrivate?: boolean }) =>
      channelsController.create(socket, data)
    )

    socket.on('channel:join', (data: { name: string }) =>
      channelsController.join(socket, io!, data)
    )

    socket.on('channel:list-members', (data: { channelId: number }) =>
      channelsController.listMembers(socket, data)
    )

    socket.on('channel:listInvites', (data: { channelId: number }) =>
      channelsController.listInvites(socket, data)
    )

    socket.on('channel:cancel', (data: { channelId: number }) =>
      channelsController.cancel(socket, io!, data)
    )

    socket.on('channel:quit', (data: { channelId: number }) =>
      channelsController.quit(socket, io!, data)
    )

    socket.on('member:kick-vote', (data: { channelId: number; targetMemberId: number }) =>
      channelsController.kick(socket, io!, data)
    )

    socket.on('member:notif-status:update', (data: { channelId: number; status: NotifStatus }) =>
      channelsController.updateNotif(socket, data)
    )

    // ────────────────────────────────────────────────────────────────
    // INVITE EVENTS
    // ────────────────────────────────────────────────────────────────
    socket.on('invite:list', () =>
      invitesController.list(socket)
    )

    socket.on('invite:create', (data: { channelId: number; nickname: string }) =>
      invitesController.create(socket, io!, data)
    )

    socket.on('invite:accept', (data: { channelId: number }) =>
      invitesController.accept(socket, io!, data)
    )

    socket.on('invite:decline', (data: { channelId: number }) =>
      invitesController.decline(socket, data)
    )

    // ────────────────────────────────────────────────────────────────
    // MESSAGE EVENTS (using prefix msg:*)
    // ────────────────────────────────────────────────────────────────
    socket.on('msg:list', (data: { channelId: number, offset: number }) =>
      messagesController.list(socket, data)
    )

    socket.on('msg:send', (data: { channelId: number; content?: string; files?: any[] }) =>
      messagesController.send(socket, io!, data)
    )

    socket.on('msg:typing', (data: { channelId: number; message: string }) =>
      messagesController.typing(socket, io!, data)
    )

    // ────────────────────────────────────────────────────────────────
    // USER EVENTS
    // ────────────────────────────────────────────────────────────────
    socket.on("user:status", (data: { status: UserStatus }) =>
      usersController.updateStatus(socket, io!, data)
    )

    // ────────────────────────────────────────────────────────────────
    // DISCONNECT
    // ────────────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      console.log('disconnect', socket.id, reason)
      
      if (user) {
        // Mark user as disconnected in database
        user.isConnected = false
        await user.save()

        // Broadcast disconnection to all users who share a channel
        await usersController.broadcastUserState(io!, user.id, user.status, false)
      }
    })
  })

  console.log('Socket.IO server attached successfully')
})

export { io }
export default io



// import app from '@adonisjs/core/services/app'
// import server from '@adonisjs/core/services/server'
// import { Server as IOServer } from 'socket.io'
// import ChannelsController from '#controllers/channels_controller'
// import Session from '#models/session'
// import { DateTime } from 'luxon'

// let io: IOServer | undefined

// app.ready(() => {
//   const nodeServer = server.getNodeServer()

//   if (!nodeServer) {
//     console.warn('Socket.IO: no HTTP server found to attach to')
//     return
//   }

//   io = new IOServer(nodeServer, {
//     cors: { origin: '*' },
//   })

//   // Socket authentication middleware
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token
      
//       if (!token) {
//         return next(new Error('Authentication error: No token provided'))
//       }

//       // Validate token against sessions table
//       const session = await Session.query()
//         .where('access_token', token)
//         .preload('user')
//         .first()

//       if (!session) {
//         return next(new Error('Authentication error: Invalid token'))
//       }

//       // Check expiration
//       if (session.expiresAt && session.expiresAt < DateTime.now()) {
//         return next(new Error('Authentication error: Token expired'))
//       }

//       // Attach user to socket
//       ;(socket as any).user = session.user
//       next()
//     } catch (error) {
//       console.error('Socket authentication error:', error)
//       next(new Error('Authentication error'))
//     }
//   })

//   const channelsController = new ChannelsController()

//   io.on('connection', async (socket) => {
//     console.log('New WS connection:', socket.id)
    
//     const user = (socket as any).user
//     if (user) {
//       // Join user-specific room for private notifications
//       socket.join(`user:${user.id}`)
      
//       // Join all channels the user is a member of
//       const Member = (await import('#models/member')).default
//       const members = await Member.query().where('user_id', user.id).select('channel_id')
//       members.forEach((member) => {
//         socket.join(`channel:${member.channelId}`)
//       })
//     }
    
//     // Send all available channels to the connected user
//     channelsController.listJoinedChannels(socket)

//     // Handle channel creation
//     socket.on('channel:create', (data: { name: string; isPrivate?: boolean }) => {
//       channelsController.create(socket, data)
//     })

//     socket.on('disconnect', (reason) => {
//       console.log('disconnect', socket.id, reason)
//     })
//   })

//   console.log('Socket.IO server attached successfully')
// })

// export { io }
// export default io
