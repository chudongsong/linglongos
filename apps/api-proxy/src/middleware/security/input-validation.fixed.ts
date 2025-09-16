import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { createValidationError } from '@/middleware/error-handler'
import { logger } from '@/utils/logger'

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
	// Sanitize request body
	if (req.body && typeof req.body === 'object') {
		req.body = sanitizeObject(req.body)
	}

	// Sanitize query parameters
	if (req.query && typeof req.query === 'object') {
		req.query = sanitizeObject(req.query)
	}

	next()
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
	if (typeof obj !== 'object' || obj === null) {
		return sanitizeValue(obj)
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item))
	}

	const sanitized: any = {}
	for (const [key, value] of Object.entries(obj)) {
		const sanitizedKey = sanitizeKey(key)
		sanitized[sanitizedKey] = sanitizeObject(value)
	}

	return sanitized
}

/**
 * Sanitize object keys
 */
function sanitizeKey(key: string): string {
	// Remove potentially dangerous characters from object keys
	return key.replace(/[^a-zA-Z0-9_-]/g, '')
}

/**
 * Sanitize individual values
 */
function sanitizeValue(value: any): any {
	if (typeof value === 'string') {
		// Remove script tags and potentially dangerous content
		return value
			.replace(/<script[^>]*>.*?<\/script>/gi, '')
			.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
			.replace(/javascript:/gi, '')
			.replace(/vbscript:/gi, '')
			.replace(/onload/gi, '')
			.replace(/onerror/gi, '')
			.trim()
	}

	return value
}

/**
 * Content Security Policy middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
	// Content Security Policy
	res.setHeader(
		'Content-Security-Policy',
		"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"connect-src 'self'; " +
			"font-src 'self'; " +
			"object-src 'none'; " +
			"media-src 'self'; " +
			"frame-src 'none';",
	)

	// Additional security headers
	res.setHeader('X-Content-Type-Options', 'nosniff')
	res.setHeader('X-Frame-Options', 'DENY')
	res.setHeader('X-XSS-Protection', '1; mode=block')
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
	res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

	next()
}

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSize: string = '10mb') => {
	return (req: Request, res: Response, next: NextFunction) => {
		const contentLength = req.get('Content-Length')

		if (contentLength) {
			const sizeInBytes = parseInt(contentLength, 10)
			const maxSizeInBytes = parseSize(maxSize)

			if (sizeInBytes > maxSizeInBytes) {
				throw createValidationError(`Request body too large. Maximum size allowed is ${maxSize}`, {
					maxSize,
					receivedSize: contentLength,
				})
			}
		}

		next()
	}
}

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
	const units: Record<string, number> = {
		b: 1,
		kb: 1024,
		mb: 1024 * 1024,
		gb: 1024 * 1024 * 1024,
	}

	const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/)
	if (!match) {
		throw new Error(`Invalid size format: ${size}`)
	}

	const [, value, unit] = match
	return parseFloat(value) * units[unit]
}

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[] = []) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (allowedIPs.length === 0) {
			// No whitelist configured, allow all
			return next()
		}

		const clientIP = getClientIP(req)

		if (!allowedIPs.includes(clientIP)) {
			logger.warn('IP not in whitelist', {
				clientIP,
				allowedIPs,
				requestId: req.requestId,
				userAgent: req.get('User-Agent'),
			})

			return res.status(403).json({
				success: false,
				error: {
					code: 'IP_NOT_ALLOWED',
					message: 'Your IP address is not allowed to access this service',
					timestamp: new Date().toISOString(),
				},
			})
		}

		next()
	}
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
	return (
		req.get('X-Forwarded-For')?.split(',')[0] ||
		req.get('X-Real-IP') ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		''
	).trim()
}

/**
 * Request validation middleware factory
 */
export const validateRequest = (schema: {
	body?: Joi.ObjectSchema
	query?: Joi.ObjectSchema
	params?: Joi.ObjectSchema
}) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const errors: string[] = []

		// Validate request body
		if (schema.body) {
			const { error } = schema.body.validate(req.body)
			if (error) {
				errors.push(`Body: ${error.details[0].message}`)
			}
		}

		// Validate query parameters
		if (schema.query) {
			const { error } = schema.query.validate(req.query)
			if (error) {
				errors.push(`Query: ${error.details[0].message}`)
			}
		}

		// Validate path parameters
		if (schema.params) {
			const { error } = schema.params.validate(req.params)
			if (error) {
				errors.push(`Params: ${error.details[0].message}`)
			}
		}

		if (errors.length > 0) {
			throw createValidationError(errors.join('; '))
		}

		next()
	}
}

/**
 * Anti-CSRF middleware
 */
export const antiCSRF = (req: Request, res: Response, next: NextFunction) => {
	// Skip CSRF protection for GET, HEAD, OPTIONS
	if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
		return next()
	}

	// Skip for API requests with proper authentication
	if (req.headers.authorization) {
		return next()
	}

	const csrfToken = req.get('X-CSRF-Token') || req.body?.csrfToken
	const sessionToken = req.get('X-Session-Token')

	if (!csrfToken || !sessionToken) {
		return res.status(403).json({
			success: false,
			error: {
				code: 'CSRF_TOKEN_MISSING',
				message: 'CSRF token is required for this request',
				timestamp: new Date().toISOString(),
			},
		})
	}

	// In a real implementation, you would validate the CSRF token here
	// For now, we just check that both tokens are present

	next()
}
