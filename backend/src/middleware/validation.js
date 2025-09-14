// Validation middleware for request data
import {
  validateUserLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateChatMessage,
  validatePagination,
  validateDateRange,
  createValidationMiddleware,
  createQueryValidationMiddleware,
} from "../utils/validation.js";

// Validate login data
export const validateLogin = createValidationMiddleware(validateUserLogin);

// Validate password change
export const validatePasswordChangeMiddleware = createValidationMiddleware(
  validatePasswordChange
);

// Validate chat message
export const validateChatMessageMiddleware =
  createValidationMiddleware(validateChatMessage);

// Validate pagination parameters
export const validatePaginationMiddleware =
  createQueryValidationMiddleware(validatePagination);

// Validate profile update
export const validateProfileUpdateMiddleware = createValidationMiddleware(
  validateProfileUpdate
);

// Validate date range
export const validateDateRangeMiddleware =
  createQueryValidationMiddleware(validateDateRange);
