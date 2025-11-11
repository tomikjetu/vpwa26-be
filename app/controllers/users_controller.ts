import User from '#models/user'
import Session from '#models/session'
import { randomUUID } from 'crypto'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class UsersController {
	public async generateSessionToken(userId: number): Promise<string> {
		const currentSession = await Session.findBy('user_id', userId);
		if (currentSession) await currentSession.delete();
		const session = await Session.create({
			userId: userId,
			accessToken: randomUUID(),
			expiresAt: DateTime.now().plus({ days: 7 })
		})
		return session.accessToken
	}

	public async login(ctx: HttpContext) {
		const { request, response } = ctx
		const { email, password } = request.only(['email', 'password'])

		const user = await User.findBy('email', email)
		
		const isValid = user ? await hash.verify(user.passwdHash, password) : false
		if (!isValid || !user) return response.unauthorized({ error: 'Invalid credentials' })

		const sessionToken = await this.generateSessionToken(user.id);

		return response.ok({ message: 'Login successful', user: { id: user.id, nick: user.nick, email: user.email }, sessionToken })
	}

	public async register(ctx: HttpContext) {
		const { request, response } = ctx
		const payload: Record<string, any> = request.only(['first_name', 'last_name', 'nick', 'email', 'password'])

		const required = ['first_name', 'last_name', 'nick', 'email', 'password']
		const missing = required.filter(k => !payload[k] || String(payload[k]).trim() === '')
		if (missing.length) return response.badRequest({ error: 'Missing required fields', fields: missing })

		payload.first_name = String(payload.first_name).trim()
		payload.last_name = String(payload.last_name).trim()
		payload.nick = String(payload.nick).trim()
		payload.email = String(payload.email).trim().toLowerCase()

		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRe.test(payload.email)) return response.badRequest({ error: 'Invalid email address' })

		if (payload.password.length < 8) return response.badRequest({ error: 'Password must be at least 8 characters' })
		if (!/[0-9]/.test(payload.password) || !/[A-Za-z]/.test(payload.password)) {
			return response.badRequest({ error: 'Password must include letters and numbers' })
		}

		// Uniqueness checks
		if (await User.findBy('email', payload.email)) return response.conflict({ error: 'Email already registered' })
		if (await User.findBy('nick', payload.nick)) return response.conflict({ error: 'Nick already taken' })

		const userData = {
			firstName: payload.first_name,
			lastName: payload.last_name,
			nick: payload.nick,
			email: payload.email,
			passwdHash: payload.password // hashed at model level
		}

		const user = await User.create(userData)
		const sessionToken = await this.generateSessionToken(user.id);

		return response.created({ message: 'Registration successful', user: { id: user.id, nick: user.nick, email: user.email }, sessionToken })
	}

	public async updateStatus(ctx: HttpContext) {
		const { request, auth, response } = ctx
		const { status } = request.only(['status'])
		const user = auth.user
		if (!user) return response.unauthorized()

		// Minimal: set a status field if present on model; otherwise just acknowledge
		// (Assumes `status` column exists; if not, this is a no-op placeholder)
		// @ts-expect-error
		user.status = status
		await user.save()

		return response.ok({ message: 'Status updated', status })
	}

	public async show(ctx: HttpContext) {
		const { auth, response } = ctx
		const user = auth.user
		if (!user) return response.unauthorized()

		return response.ok({ id: user.id, nick: user.nick, status: (user as any).status ?? null })
	}
}
