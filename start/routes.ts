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
  router.get('/uploads/:channel_id/files/:file_UUID', '#controllers/files_controller.downloadFile')

  // Post files belonging to messages/channels
  router.post('/channels/:channel_id/files', '#controllers/files_controller.uploadFiles')

}).middleware([middleware.auth()])