import request from 'supertest'
import ApiProxyServer from '@/app'

describe('Auth API Integration Tests', () => {
	let app: any
	let server: ApiProxyServer

	beforeAll(async () => {
		server = new ApiProxyServer()
		app = server.getApp()
	})

	describe('POST /api/auth/register', () => {
		const validUser = {
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123',
		}

		test('should register user successfully', async () => {
			const response = await request(app).post('/api/auth/register').send(validUser).expect(201)

			expect(response.body.success).toBe(true)
			expect(response.body.data.user.username).toBe(validUser.username)
			expect(response.body.data.user.email).toBe(validUser.email)
			expect(response.body.data.tokens.accessToken).toBeDefined()
			expect(response.body.data.tokens.refreshToken).toBeDefined()
			expect(response.body.data.user.password).toBeUndefined()
		})

		test('should register user without email', async () => {
			const userWithoutEmail = {
				username: 'testuser2',
				password: 'password123',
			}

			const response = await request(app).post('/api/auth/register').send(userWithoutEmail).expect(201)

			expect(response.body.success).toBe(true)
			expect(response.body.data.user.username).toBe(userWithoutEmail.username)
			expect(response.body.data.user.email).toBeNull()
		})

		test('should reject duplicate username', async () => {
			await request(app).post('/api/auth/register').send(validUser)

			const response = await request(app)
				.post('/api/auth/register')
				.send({
					username: validUser.username,
					password: 'different-password',
				})
				.expect(400)

			expect(response.body.success).toBe(false)
			expect(response.body.error.message).toContain('already exists')
		})

		test('should reject invalid email format', async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'testuser3',
					email: 'invalid-email',
					password: 'password123',
				})
				.expect(400)

			expect(response.body.success).toBe(false)
		})

		test('should reject short password', async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'testuser4',
					password: '123',
				})
				.expect(400)

			expect(response.body.success).toBe(false)
		})

		test('should reject missing required fields', async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'testuser5',
					// missing password
				})
				.expect(400)

			expect(response.body.success).toBe(false)
		})
	})

	describe('POST /api/auth/login', () => {
		const testUser = {
			username: 'loginuser',
			password: 'loginpassword123',
		}

		beforeEach(async () => {
			// Register a user for login tests
			await request(app).post('/api/auth/register').send(testUser)
		})

		test('should login successfully with valid credentials', async () => {
			const response = await request(app).post('/api/auth/login').send(testUser).expect(200)

			expect(response.body.success).toBe(true)
			expect(response.body.data.user.username).toBe(testUser.username)
			expect(response.body.data.tokens.accessToken).toBeDefined()
			expect(response.body.data.tokens.refreshToken).toBeDefined()
		})

		test('should reject invalid username', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({
					username: 'nonexistent',
					password: testUser.password,
				})
				.expect(401)

			expect(response.body.success).toBe(false)
			expect(response.body.error.message).toContain('Invalid')
		})

		test('should reject invalid password', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({
					username: testUser.username,
					password: 'wrongpassword',
				})
				.expect(401)

			expect(response.body.success).toBe(false)
			expect(response.body.error.message).toContain('Invalid')
		})

		test('should reject missing credentials', async () => {
			const response = await request(app).post('/api/auth/login').send({}).expect(400)

			expect(response.body.success).toBe(false)
		})
	})

	describe('POST /api/auth/refresh', () => {
		let refreshToken: string

		beforeEach(async () => {
			// Register and login to get refresh token
			const registerResponse = await request(app).post('/api/auth/register').send({
				username: 'refreshuser',
				password: 'password123',
			})

			refreshToken = registerResponse.body.data.tokens.refreshToken
		})

		test('should refresh token successfully', async () => {
			const response = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200)

			expect(response.body.success).toBe(true)
			expect(response.body.data.tokens.accessToken).toBeDefined()
			expect(response.body.data.tokens.refreshToken).toBeDefined()
		})

		test('should reject invalid refresh token', async () => {
			const response = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid-token' }).expect(401)

			expect(response.body.success).toBe(false)
		})

		test('should reject missing refresh token', async () => {
			const response = await request(app).post('/api/auth/refresh').send({}).expect(400)

			expect(response.body.success).toBe(false)
		})
	})

	describe('GET /api/auth/me', () => {
		let accessToken: string
		let userId: string

		beforeEach(async () => {
			// Register and login to get access token
			const registerResponse = await request(app).post('/api/auth/register').send({
				username: 'meuser',
				email: 'me@example.com',
				password: 'password123',
			})

			accessToken = registerResponse.body.data.tokens.accessToken
			userId = registerResponse.body.data.user.id
		})

		test('should get user info with valid token', async () => {
			const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200)

			expect(response.body.success).toBe(true)
			expect(response.body.data.user.id).toBe(userId)
			expect(response.body.data.user.username).toBe('meuser')
			expect(response.body.data.user.email).toBe('me@example.com')
		})

		test('should reject request without token', async () => {
			const response = await request(app).get('/api/auth/me').expect(401)

			expect(response.body.success).toBe(false)
		})

		test('should reject request with invalid token', async () => {
			const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token').expect(401)

			expect(response.body.success).toBe(false)
		})
	})

	describe('PUT /api/auth/password', () => {
		let accessToken: string
		const originalPassword = 'password123'
		const newPassword = 'newpassword456'

		beforeEach(async () => {
			// Register user
			const registerResponse = await request(app).post('/api/auth/register').send({
				username: 'passworduser',
				password: originalPassword,
			})

			accessToken = registerResponse.body.data.tokens.accessToken
		})

		test('should change password successfully', async () => {
			const response = await request(app)
				.put('/api/auth/password')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					currentPassword: originalPassword,
					newPassword: newPassword,
				})
				.expect(200)

			expect(response.body.success).toBe(true)

			// Verify new password works
			const loginResponse = await request(app)
				.post('/api/auth/login')
				.send({
					username: 'passworduser',
					password: newPassword,
				})
				.expect(200)

			expect(loginResponse.body.success).toBe(true)
		})

		test('should reject wrong current password', async () => {
			const response = await request(app)
				.put('/api/auth/password')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					currentPassword: 'wrongpassword',
					newPassword: newPassword,
				})
				.expect(401)

			expect(response.body.success).toBe(false)
		})

		test('should reject request without authentication', async () => {
			const response = await request(app)
				.put('/api/auth/password')
				.send({
					currentPassword: originalPassword,
					newPassword: newPassword,
				})
				.expect(401)

			expect(response.body.success).toBe(false)
		})
	})

	describe('POST /api/auth/logout', () => {
		let accessToken: string

		beforeEach(async () => {
			// Register user
			const registerResponse = await request(app).post('/api/auth/register').send({
				username: 'logoutuser',
				password: 'password123',
			})

			accessToken = registerResponse.body.data.tokens.accessToken
		})

		test('should logout successfully', async () => {
			const response = await request(app)
				.post('/api/auth/logout')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(response.body.success).toBe(true)
		})
	})
})
