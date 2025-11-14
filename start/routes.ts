/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Define all HTTP routes for the API.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Public routes (no authentication required)
router.group(() => {
  router.post('/user/login', '#controllers/users_controller.login') // Login: body params => email, password
  router.post('/user/register', '#controllers/users_controller.register') // Register: body params => first_name, last_name, nick, email, password
}).middleware([])

// Protected routes (require authentication) 


  router.group(() => {
  // router.post('/channels/:channel_id/notifications', 'channels_controller.toggleNotifications') // Changes notification state for a channel: body params => notification_status

  router.post('/user/status', '#controllers/users_controller.updateStatus') // For updating user status between Online, DND, Offline: body params => status
  router.get('/user/me', '#controllers/users_controller.show') // For showing user information, specifically status and nickname
  router.post('/user/logout', '#controllers/users_controller.logout') // Logout: invalidates the current session
  

  // TODO: remove the following routes, add them to socket handlers instead

  router.get('/channels', '#controllers/channels_controller.index') // Returns all channels a user owns or joined
  router.get('/channels/invites', '#controllers/invites_controller.index') // Returns all pending channel invites of the user

  router.post('/channels/create', '#controllers/channels_controller.create') // Creates a new channel: body params => name, is_private
  router.post('/channels/join/:name', '#controllers/channels_controller.join') // Joins an existing channel or creates a new one when that channel doesn't exist

  router.group(() => {
    router.get('/channels/:channel_id/messages', '#controllers/messages_controller.index')

    router.post('/channels/:channel_id/invite/:nickname', '#controllers/invites_controller.create') // Invites a user to a channel
    router.post('/channels/invites/:channel_id', '#controllers/invites_controller.accept') // Accepts the invite to a channel
    router.post('/channels/:channel_id/notifications', '#controllers/channels_controller.updateNotifStatus') // Changes notification state for a channel: body params => notif_status

    router.get('/channels/:channel_id/members', '#controllers/channels_controller.listMembers') // Returns the list of members for a channel
    router.get('/channels/:channel_id/members/invited', '#controllers/channels_controller.listInvited') // Returns the list of invited members for a channel
    
    router.group(() => {
      router.post('/channels/:channel_id/cancel', '#controllers/channels_controller.cancel') // Leaves the channel. If it is the owner, deletes the channel
      router.post('/channels/:channel_id/quit', '#controllers/channels_controller.quit') // Deletes the channel, has to be the owner
      router.post('/channels/:channel_id/messages', '#controllers/messages_controller.store') // Posts a new message to the channel: body params => content, files

      router.get('/channels/:channel_id/files/:file_id', '#controllers/channels_controller.getFile') // Get a file from the public folder based on its id

      router.group(() => {
        router.post('/channels/:channel_id/members/:member_id/revoke', '#controllers/channels_controller.revokeMember') // Revokes the member, has to be owner, doesn't kick them forever
        router.post('/channels/:channel_id/members/:member_id/kick', '#controllers/channels_controller.kickMember') // Kicks member, if isn't member simply will add a new kick_vote, if the number of kick_votes > 2 then member will get kicked (the kick votes themselves stay inside the database). If the kick_vote was from an owner, member will also get kicked
      }).middleware([middleware.loadMember()])
    }).middleware([middleware.loadUserMember()])
  }).middleware([middleware.loadChannel()])
}).middleware([middleware.auth()])