/**
 * Email Service (Resend Version)
 * Drop-in replacement for emailService.js using Resend instead of nodemailer
 *
 * To use:
 * 1. npm install resend
 * 2. Rename this file to emailService.js (backup the original)
 * 3. Set RESEND_API_KEY in your .env
 */
import { Resend } from "resend";
import crypto from "crypto";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
  if (!resend) {
    console.error("❌ RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:4000"
  }/verify-email/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "VideoCall App <noreply@yourdomain.com>",
      to: [email],
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
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      return { success: false, error: error.message };
    }

    console.log(`📧 Verification email sent to ${email}: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, username, token) => {
  if (!resend) {
    console.error("❌ RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:4000"
  }/reset-password/${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "VideoCall App <noreply@yourdomain.com>",
      to: [email],
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
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    console.log(`📧 Password reset email sent to ${email}: ${data?.id}`);
    return { success: true, messageId: data?.id };
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
