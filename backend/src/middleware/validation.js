// Validation middleware for request data

// Validate user registration data
export const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (
    password &&
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
      password
    )
  ) {
    errors.push(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
  }

  // Name validation
  if (!firstName || firstName.trim().length < 1) {
    errors.push("First name is required");
  }
  if (!lastName || lastName.trim().length < 1) {
    errors.push("Last name is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate login data
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  }
  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate password change
export const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push("Current password is required");
  }
  if (!newPassword) {
    errors.push("New password is required");
  }
  if (newPassword && newPassword.length < 8) {
    errors.push("New password must be at least 8 characters long");
  }
  if (
    newPassword &&
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
      newPassword
    )
  ) {
    errors.push(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate chat message
export const validateChatMessage = (req, res, next) => {
  const { roomId, message, messageType } = req.body;
  const errors = [];

  if (!roomId) {
    errors.push("Room ID is required");
  }
  if (!message || message.trim().length < 1) {
    errors.push("Message is required");
  }
  if (message && message.length > 1000) {
    errors.push("Message must be less than 1000 characters");
  }
  if (
    messageType &&
    !["text", "image", "file", "system"].includes(messageType)
  ) {
    errors.push("Invalid message type");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be a number between 1 and 100",
    });
  }

  if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
    return res.status(400).json({
      success: false,
      message: "Offset must be a non-negative number",
    });
  }

  next();
};

// Validate date range
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  const errors = [];

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push("Invalid start date format");
  }
  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push("Invalid end date format");
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push("Start date must be before end date");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};
