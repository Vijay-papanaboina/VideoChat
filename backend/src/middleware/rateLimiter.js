/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */
import rateLimit from "express-rate-limit";

// General API limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Strict limiter for auth endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Room creation limiter - 10 rooms per hour
export const roomCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: "Too many rooms created, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User search limiter - 30 searches per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: "Too many search requests, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
