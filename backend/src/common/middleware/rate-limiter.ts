import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Allow up to 5 requests per 15 minutes (or 1000 during testing)
  message: {
    error: 'Too many requests, please try again after 15 minutes',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
