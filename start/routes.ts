import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (NO AUTH REQUIRED)
// ────────────────────────────────────────────────────────────────

router.group(() => {
  router.post('/user/login', '#controllers/auth_controller.login')
  router.post('/user/register', '#controllers/auth_controller.register')
}).middleware([middleware.guest()])


// ────────────────────────────────────────────────────────────────
// AUTHENTICATED ROUTES (HTTP WHERE NEEDED)
// ────────────────────────────────────────────────────────────────

router.group(() => {

  // Core user session lifecycle
  router.post('/user/logout', '#controllers/auth_controller.logout')

  // Fetch files belonging to messages/channels
  router.get('/channels/:channel_id/files/:file_id', '#controllers/channels_controller.getFile')

}).middleware([middleware.auth()])