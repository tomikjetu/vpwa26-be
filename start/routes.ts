import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (NO AUTH REQUIRED)
// ────────────────────────────────────────────────────────────────

router.group(() => {
  router.post('/user/login', '#controllers/users_controller.login')
  router.post('/user/register', '#controllers/users_controller.register')
}).middleware([middleware.guest()])


// ────────────────────────────────────────────────────────────────
// AUTHENTICATED ROUTES (HTTP WHERE NEEDED)
// ────────────────────────────────────────────────────────────────

router.group(() => {

  // Core user session lifecycle
  router.post('/user/logout', '#controllers/users_status_controller.logout')

  // Fetch files belonging to messages/channels
  router.get('/channels/:channel_id/files/:file_id', '#controllers/channels_controller.getFile')

}).middleware([middleware.auth()])