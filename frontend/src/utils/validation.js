// Centralized validation utilities for frontend

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation regex (letters, numbers, underscores only)
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Password complexity regex (uppercase, lowercase, number, special character)
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Validation constants
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 30,
  },
  email: {
    pattern: EMAIL_REGEX,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: PASSWORD_REGEX,
  },
  firstName: {
    minLength: 1,
    maxLength: 50,
  },
  lastName: {
    minLength: 1,
    maxLength: 50,
  },
  bio: {
    maxLength: 500,
  },
  roomId: {
    minLength: 3,
    maxLength: 20,
  },
  message: {
    minLength: 1,
    maxLength: 1000,
  },
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  username: {
    required: "Username is required",
    minLength: `Username must be at least ${VALIDATION_RULES.username.minLength} characters long`,
    maxLength: `Username must be less than ${VALIDATION_RULES.username.maxLength} characters`,
    pattern: "Username can only contain letters, numbers, and underscores",
  },
  email: {
    required: "Email is required",
    invalid: "Invalid email format",
  },
  password: {
    required: "Password is required",
    minLength: `Password must be at least ${VALIDATION_RULES.password.minLength} characters long`,
    maxLength: `Password must be less than ${VALIDATION_RULES.password.maxLength} characters`,
    pattern:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    mismatch: "Passwords do not match",
  },
  firstName: {
    required: "First name is required",
    minLength: `First name must be at least ${VALIDATION_RULES.firstName.minLength} character long`,
    maxLength: `First name must be less than ${VALIDATION_RULES.firstName.maxLength} characters`,
  },
  lastName: {
    required: "Last name is required",
    minLength: `Last name must be at least ${VALIDATION_RULES.lastName.minLength} character long`,
    maxLength: `Last name must be less than ${VALIDATION_RULES.lastName.maxLength} characters`,
  },
  bio: {
    maxLength: `Bio must be less than ${VALIDATION_RULES.bio.maxLength} characters`,
  },
  roomId: {
    required: "Room ID is required",
    minLength: `Room ID must be at least ${VALIDATION_RULES.roomId.minLength} characters long`,
    maxLength: `Room ID must be less than ${VALIDATION_RULES.roomId.maxLength} characters`,
  },
  message: {
    required: "Message is required",
    minLength: `Message must be at least ${VALIDATION_RULES.message.minLength} character long`,
    maxLength: `Message must be less than ${VALIDATION_RULES.message.maxLength} characters`,
  },
};

// Individual validation functions
export const validateUsername = (username) => {
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.username.required);
  } else {
    if (username.length < VALIDATION_RULES.username.minLength) {
      errors.push(VALIDATION_MESSAGES.username.minLength);
    }
    if (username.length > VALIDATION_RULES.username.maxLength) {
      errors.push(VALIDATION_MESSAGES.username.maxLength);
    }
    if (!USERNAME_REGEX.test(username)) {
      errors.push(VALIDATION_MESSAGES.username.pattern);
    }
  }

  return errors;
};

export const validateEmail = (email) => {
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.email.required);
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push(VALIDATION_MESSAGES.email.invalid);
  }

  return errors;
};

export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length === 0) {
    errors.push(VALIDATION_MESSAGES.password.required);
  } else {
    if (password.length < VALIDATION_RULES.password.minLength) {
      errors.push(VALIDATION_MESSAGES.password.minLength);
    }
    if (password.length > VALIDATION_RULES.password.maxLength) {
      errors.push(VALIDATION_MESSAGES.password.maxLength);
    }
    if (!PASSWORD_REGEX.test(password)) {
      errors.push(VALIDATION_MESSAGES.password.pattern);
    }
  }

  return errors;
};

export const validateFirstName = (firstName) => {
  const errors = [];

  if (!firstName || firstName.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.firstName.required);
  } else {
    if (firstName.length < VALIDATION_RULES.firstName.minLength) {
      errors.push(VALIDATION_MESSAGES.firstName.minLength);
    }
    if (firstName.length > VALIDATION_RULES.firstName.maxLength) {
      errors.push(VALIDATION_MESSAGES.firstName.maxLength);
    }
  }

  return errors;
};

export const validateLastName = (lastName) => {
  const errors = [];

  if (!lastName || lastName.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.lastName.required);
  } else {
    if (lastName.length < VALIDATION_RULES.lastName.minLength) {
      errors.push(VALIDATION_MESSAGES.lastName.minLength);
    }
    if (lastName.length > VALIDATION_RULES.lastName.maxLength) {
      errors.push(VALIDATION_MESSAGES.lastName.maxLength);
    }
  }

  return errors;
};

export const validateBio = (bio) => {
  const errors = [];

  if (bio && bio.length > VALIDATION_RULES.bio.maxLength) {
    errors.push(VALIDATION_MESSAGES.bio.maxLength);
  }

  return errors;
};

export const validateRoomId = (roomId) => {
  const errors = [];

  if (!roomId || roomId.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.roomId.required);
  } else {
    if (roomId.length < VALIDATION_RULES.roomId.minLength) {
      errors.push(VALIDATION_MESSAGES.roomId.minLength);
    }
    if (roomId.length > VALIDATION_RULES.roomId.maxLength) {
      errors.push(VALIDATION_MESSAGES.roomId.maxLength);
    }
  }

  return errors;
};

export const validateMessage = (message) => {
  const errors = [];

  if (!message || message.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.message.required);
  } else {
    if (message.length < VALIDATION_RULES.message.minLength) {
      errors.push(VALIDATION_MESSAGES.message.minLength);
    }
    if (message.length > VALIDATION_RULES.message.maxLength) {
      errors.push(VALIDATION_MESSAGES.message.maxLength);
    }
  }

  return errors;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  const errors = [];

  if (password !== confirmPassword) {
    errors.push(VALIDATION_MESSAGES.password.mismatch);
  }

  return errors;
};

// Composite validation functions
export const validateRegistration = (formData) => {
  const errors = [];

  errors.push(...validateUsername(formData.username));
  errors.push(...validateEmail(formData.email));
  errors.push(...validatePassword(formData.password));
  errors.push(...validateFirstName(formData.firstName));
  errors.push(...validateLastName(formData.lastName));

  // Check password match if confirmPassword is provided
  if (formData.confirmPassword) {
    errors.push(
      ...validatePasswordMatch(formData.password, formData.confirmPassword)
    );
  }

  return errors;
};

export const validateLogin = (formData) => {
  const errors = [];

  errors.push(...validateEmail(formData.email));

  if (!formData.password || formData.password.length === 0) {
    errors.push("Password is required");
  }

  return errors;
};

export const validatePasswordChange = (passwordData) => {
  const errors = [];

  if (
    !passwordData.currentPassword ||
    passwordData.currentPassword.length === 0
  ) {
    errors.push("Current password is required");
  }

  errors.push(...validatePassword(passwordData.newPassword));
  errors.push(
    ...validatePasswordMatch(
      passwordData.newPassword,
      passwordData.confirmPassword
    )
  );

  return errors;
};

export const validateProfileUpdate = (profileData) => {
  const errors = [];

  if (profileData.firstName !== undefined) {
    errors.push(...validateFirstName(profileData.firstName));
  }
  if (profileData.lastName !== undefined) {
    errors.push(...validateLastName(profileData.lastName));
  }
  if (profileData.bio !== undefined) {
    errors.push(...validateBio(profileData.bio));
  }

  return errors;
};

export const validateRoomJoin = (roomData) => {
  const errors = [];

  errors.push(...validateRoomId(roomData.roomId));

  // Username validation for anonymous users
  if (
    !roomData.isAuthenticated &&
    (!roomData.username || roomData.username.trim().length === 0)
  ) {
    errors.push("Username is required for anonymous users");
  }

  return errors;
};

export const validateRoomCreate = (roomData) => {
  const errors = [];

  errors.push(...validateRoomId(roomData.roomId));

  // Username validation for anonymous users
  if (
    !roomData.isAuthenticated &&
    (!roomData.username || roomData.username.trim().length === 0)
  ) {
    errors.push("Username is required for anonymous users");
  }

  return errors;
};

export const validateChatMessage = (messageData) => {
  const errors = [];

  if (!messageData.roomId || messageData.roomId.trim().length === 0) {
    errors.push("Room ID is required");
  }

  errors.push(...validateMessage(messageData.message));

  // Message type validation
  if (
    messageData.messageType &&
    !["text", "image", "file", "system"].includes(messageData.messageType)
  ) {
    errors.push("Invalid message type");
  }

  return errors;
};

// Utility function to get first error message
export const getFirstError = (errors) => {
  return errors.length > 0 ? errors[0] : null;
};

// Utility function to check if validation passes
export const isValid = (errors) => {
  return errors.length === 0;
};
