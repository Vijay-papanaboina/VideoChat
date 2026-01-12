/**
 * Email Service
 * Handles sending verification and password reset emails
 */
import nodemailer from "nodemailer";
import crypto from "crypto";

// Create transporter based on environment
const createTransporter = () => {
  // For development: use Ethereal (fake SMTP)
  if (process.env.NODE_ENV !== "production") {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.SMTP_USER || "ethereal_user",
        pass: process.env.SMTP_PASS || "ethereal_pass",
      },
    });
  }

  // For production: use configured SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

// Generate secure token
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate token expiry (24 hours for verification, 1 hour for reset)
export const generateExpiry = (hours = 24) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// Send verification email
export const sendVerificationEmail = async (email, username, token) => {
  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:4000"
  }/verify-email/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"VideoCall App" <noreply@videocall.app>',
    to: email,
    subject: "Verify Your Email - VideoCall App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to VideoCall App!</h1>
        <p>Hi ${username},</p>
        <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link expires in 24 hours. If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Welcome to VideoCall App!
      
      Hi ${username},
      
      Please verify your email by visiting: ${verificationUrl}
      
      This link expires in 24 hours.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email}: ${info.messageId}`);

    // In development, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:4000"
  }/reset-password/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"VideoCall App" <noreply@videocall.app>',
    to: email,
    subject: "Reset Your Password - VideoCall App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link expires in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hi ${username},
      
      Reset your password by visiting: ${resetUrl}
      
      This link expires in 1 hour.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}: ${info.messageId}`);

    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  generateToken,
  generateExpiry,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
