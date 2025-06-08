const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sendEmail } = require('../utils/email');
const { validateEmail, validatePassword } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { generateTokens, verifyRefreshToken } = require('../utils/auth');

class AuthController {
  // Register new user
  static async register(req, res, next) {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        displayName,
        dateOfBirth,
        timezone,
        language = 'en'
      } = req.body;

      // Validate input
      if (!validateEmail(email)) {
        return next(new AppError('Invalid email format', 400));
      }

      if (!validatePassword(password)) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return next(new AppError('User with this email already exists', 409));
      }

      // Create new user
      const userData = {
        email,
        password,
        firstName,
        lastName,
        displayName: displayName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        dateOfBirth,
        timezone: timezone || 'UTC',
        language,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const user = await User.create(userData);

      // Generate email verification token
      const verificationToken = user.createEmailVerificationToken();
      await user.save();

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Mistika - Verify Your Email',
        template: 'emailVerification',
        data: {
          name: user.getFullName(),
          verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
          loginUrl: `${process.env.CLIENT_URL}/login`
        }
      });

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: user.toJSON(),
          accessToken,
          needsEmailVerification: true
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req, res, next) {
    try {
      const { email, password, rememberMe = false } = req.body;

      // Validate input
      if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
      }

      // Find user and include password for comparison
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        attributes: { include: ['password'] }
      });

      if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Invalid email or password', 401));
      }

      // Check if user is active
      if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 401));
      }

      // Update login information
      await user.updateLoginInfo(req.ip, req.get('User-Agent'));

      // Generate JWT tokens
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const { accessToken, refreshToken } = generateTokens(user.id, tokenExpiry);

      // Set refresh token as httpOnly cookie
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          accessToken,
          emailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout user
  static async logout(req, res, next) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return next(new AppError('No refresh token provided', 401));
      }

      // Verify refresh token
      const { userId } = verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        return next(new AppError('Invalid refresh token', 401));
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      // Set new refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return next(new AppError('Verification token is required', 400));
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with matching verification token
      const user = await User.findOne({
        where: { emailVerificationToken: hashedToken }
      });

      if (!user) {
        return next(new AppError('Invalid or expired verification token', 400));
      }

      // Update user as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend verification email
  static async resendVerification(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (user.isEmailVerified) {
        return next(new AppError('Email is already verified', 400));
      }

      // Generate new verification token
      const verificationToken = user.createEmailVerificationToken();
      await user.save();

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Mistika - Verify Your Email',
        template: 'emailVerification',
        data: {
          name: user.getFullName(),
          verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
        }
      });

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Send password reset email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Mistika - Password Reset Request',
          template: 'passwordReset',
          data: {
            name: user.getFullName(),
            resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
            expiryTime: '10 minutes'
          }
        });

        res.json({
          success: true,
          message: 'Password reset link sent to your email'
        });
      } catch (emailError) {
        // Reset the token if email fails
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        return next(new AppError('Failed to send password reset email. Please try again.', 500));
      }
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req, res, next) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        return next(new AppError('Token, password, and password confirmation are required', 400));
      }

      if (password !== confirmPassword) {
        return next(new AppError('Passwords do not match', 400));
      }

      if (!validatePassword(password)) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with matching reset token and check expiry
      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: {
            [User.sequelize.Sequelize.Op.gt]: Date.now()
          }
        }
      });

      if (!user) {
        return next(new AppError('Invalid or expired password reset token', 400));
      }

      // Update password and clear reset token
      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      // Generate new JWT tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Set refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Password reset successful',
        data: {
          user: user.toJSON(),
          accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password (for authenticated users)
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new AppError('Current password, new password, and confirmation are required', 400));
      }

      if (newPassword !== confirmPassword) {
        return next(new AppError('New passwords do not match', 400));
      }

      if (!validatePassword(newPassword)) {
        return next(new AppError('New password must be at least 6 characters long', 400));
      }

      // Get user with password
      const user = await User.findOne({
        where: { id: userId },
        attributes: { include: ['password'] }
      });

      // Verify current password
      if (!(await user.comparePassword(currentPassword))) {
        return next(new AppError('Current password is incorrect', 401));
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  static async getCurrentUser(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            association: 'readings',
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify token (for client-side token validation)
  static async verifyToken(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
          tokenValid: true
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Social login (placeholder for OAuth implementation)
  static async socialLogin(req, res, next) {
    try {
      const { provider, token, userData } = req.body;

      // This would integrate with OAuth providers like Google, Facebook, etc.
      // For now, return a placeholder response

      res.json({
        success: false,
        message: 'Social login not implemented yet'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete account
  static async deleteAccount(req, res, next) {
    try {
      const { password, confirmation } = req.body;
      const userId = req.user.id;

      if (confirmation !== 'DELETE') {
        return next(new AppError('Please type "DELETE" to confirm account deletion', 400));
      }

      // Get user with password
      const user = await User.findOne({
        where: { id: userId },
        attributes: { include: ['password'] }
      });

      // Verify password
      if (!(await user.comparePassword(password))) {
        return next(new AppError('Password is incorrect', 401));
      }

      // Soft delete - deactivate account instead of hard delete
      user.isActive = false;
      user.email = `deleted_${Date.now()}_${user.email}`;
      await user.save();

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;