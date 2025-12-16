// Security middleware and utilities

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 60000) {
      rateLimitStore.delete(key)
    }
  }
}, 300000)

// Rate limiter middleware
export function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 100, // max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
  } = options

  return (req, res, next) => {
    const key = keyGenerator(req)
    const now = Date.now()
    
    let data = rateLimitStore.get(key)
    
    if (!data || now - data.windowStart > windowMs) {
      data = { count: 0, windowStart: now }
    }
    
    data.count++
    rateLimitStore.set(key, data)
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count))
    res.setHeader('X-RateLimit-Reset', Math.ceil((data.windowStart + windowMs) / 1000))
    
    if (data.count > max) {
      return res.status(429).json({ error: message })
    }
    
    next()
  }
}

// Strict rate limiter for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 60000 * 15, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: 'Too many login attempts, please try again in 15 minutes'
})

// API rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Rate limit exceeded'
})

// Signal rate limiter (more generous)
export const signalRateLimit = rateLimit({
  windowMs: 60000,
  max: 60, // 1 signal per second average
  message: 'Signal rate limit exceeded'
})

// Input sanitization
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 10000) // Limit length
}

// Sanitize object recursively
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeInput(key)] = sanitizeObject(value)
  }
  return sanitized
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate API key format
export function isValidApiKey(key) {
  // API keys should be alphanumeric with underscores, 20-64 chars
  return /^[a-zA-Z0-9_]{20,64}$/.test(key)
}

// Mask sensitive data for logging
export function maskSensitive(data) {
  if (typeof data !== 'object' || data === null) return data
  
  const masked = { ...data }
  const sensitiveFields = ['password', 'api_key', 'token', 'secret', 'apiKey', 'whop_api_key']
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = masked[field].slice(0, 4) + '****'
    }
  }
  
  return masked
}

// Security headers middleware
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
}

// Request logging with masked sensitive data
export function requestLogger(req, res, next) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for']
    }
    
    // Only log body for non-GET requests, masked
    if (req.method !== 'GET' && req.body) {
      log.body = maskSensitive(req.body)
    }
    
    console.log(JSON.stringify(log))
  })
  
  next()
}
