import { databaseService } from '@/services/database.service'

// Setup test environment
process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = ':memory:' // Use in-memory database for tests
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'

// Global test setup
beforeAll(async () => {
	// Initialize test database
	await databaseService.initialize()
})

// Global test teardown
afterAll(async () => {
	// Close database connection
	await databaseService.close()
})

// Clean up after each test
afterEach(async () => {
	// Clean up test data if needed
	if (databaseService.isConnected()) {
		const db = databaseService.getDatabase()
		await db.exec(`
      DELETE FROM api_logs;
      DELETE FROM panel_configs;
      DELETE FROM user_sessions;
      DELETE FROM users;
    `)
	}
})
