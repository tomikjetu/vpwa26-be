import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import Session from '#models/session'
import { DateTime } from 'luxon'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Check Authorization header for Bearer token first
    const authHeader = ctx.request.header('authorization') || ctx.request.header('Authorization')

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1]

      try {
        const session = await Session.query().where('access_token', token).preload('user').first()

        if (!session) {
          return ctx.response.unauthorized({ error: 'Invalid token' })
        }

        // Check expiration
        if (session.expiresAt && session.expiresAt < DateTime.now()) {
          return ctx.response.unauthorized({ error: 'Token expired' })
        }
        
        // Attach user to ctx and set authenticator user so downstream middleware/controllers can use it
        const user = (session as any).user
        ;(ctx as any).user = user

        try {
          // Use the default 'web' guard to set the authenticated user on the guard
          await ctx.auth.use('web').login(user)
        } catch (loginErr) {
          // If login fails for some reason, still attach user to ctx so downstream can use it
          console.warn('Auth middleware: failed to login user into guard', loginErr)
        }
        return next()
      } catch (error) {
        console.error('Auth middleware error while validating bearer token', error)
        return ctx.response.unauthorized({ error: 'Invalid token' })
      }
    }else {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }
  }
}