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
  router.post('/user/login', 'UsersController.login') // Login: body params => email, password
  router.post('/user/register', 'UsersController.register') // Register: body params => first_name, last_name, nickname, email, password
}).middleware([middleware.guest()])

// Protected routes (require authentication)
router.group(() => {
  
  router.post('/user/status', 'UsersController.updateStatus') // For updating user status between Online, DND, Offline: body params => status
  router.get('/user', 'UsersController.show') // For showing user information, specifically status and nickname

  router.get('/channels', 'ChannelsController.index') // Returns all channels a user owns or joined
  router.post('/channels/create', 'ChannelsController.create') // Creates a new channel: body params => name, is_private
  router.post('/channels/join/:name', 'ChannelsController.join') // Joins an existing channel or creates a new one when that channel doesn't exist

  router.group(() => {
    router.post('/channels/:channel_id/invite/:nickname', 'ChannelsController.invite') // Invites a user to a channel
    // router.post('/channels/:channel_id/notifications', 'ChannelsController.toggleNotifications') // Changes notification state for a channel: body params => notification_status

    router.get('/channels/:channel_id/members', 'ChannelsController.listMembers') // Returns the list of members for a channel
    router.get('/channels/:channel_id/members/invited', 'ChannelsController.listInvited') // Returns the list of invited members for a channel
    
    router.group(() => {
      router.post('/channels/:channel_id/cancel', 'ChannelsController.cancel') // Leaves the channel. If it is the owner, deletes the channel
      router.post('/channels/:channel_id/quit', 'ChannelsController.quit') // Deletes the channel, has to be the owner

      router.group(() => {
        router.post('/channels/:channel_id/members/:member_id/revoke', 'ChannelsController.revokeMember') // Revokes the member, has to be owner, doesn't kick them forever
        router.post('/channels/:channel_id/members/:member_id/kick', 'ChannelsController.kickMember') // Kicks member, if isn't member simply will add a new kick_vote, if the number of kick_votes > 2 then member will get kicked (the kick votes themselves stay inside the database). If the kick_vote was from an owner, member will also get kicked
      }).middleware([middleware.loadMember()])
    }).middleware([middleware.ownerStatus()])
  }).middleware([middleware.loadChannel()])

  router.get('/channels/invites', 'ChannelsController.listInvites')
}).middleware([middleware.auth()])