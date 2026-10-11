import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { AuthSession } from '../models/AuthSession';
import { OtpVerification } from '../models/OtpVerification';
import { EmailService } from './emailService';
import { config } from '../config/env';

export class AuthService {
  private static generateTokens(userId: string, businessId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, businessId, role },
      config.ACCESS_TOKEN_SECRET || 'fallback_access_secret',
      { expiresIn: '30m' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    return { accessToken, refreshToken };
  }

  static async signupStart(email: string, businessName: string, address: string, phone: string) {
    email = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email is already registered');

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpVerification.create({
      email,
      purpose: 'SIGNUP',
      otpHash,
      expiresAt
    });

    await EmailService.sendSignupOtp(email, otp);
  }

  static async signupVerifyOtp(email: string, otp: string) {
    email = email.toLowerCase().trim();
    const record = await OtpVerification.findOne({ email, purpose: 'SIGNUP', consumedAt: null }).sort({ createdAt: -1 });
    if (!record) throw new Error('Verification code is incorrect or expired');
    if (record.expiresAt < new Date()) throw new Error('Verification code expired');
    if (record.attempts >= 5) throw new Error('Too many attempts');

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      throw new Error('Verification code is incorrect');
    }

    record.consumedAt = new Date();
    await record.save();
    
    // Return a temporary token for the next step
    return jwt.sign({ email, purpose: 'SIGNUP_COMPLETE' }, config.ACCESS_TOKEN_SECRET || 'fallback_access_secret', { expiresIn: '15m' });
  }

  static async signupComplete(token: string, password: string, businessName: string, address: string, phone: string) {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET || 'fallback_access_secret') as any;
    if (decoded.purpose !== 'SIGNUP_COMPLETE') throw new Error('Invalid token');
    const email = decoded.email;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) throw new Error('Email is already registered');

      const business = new Business({ businessName, address, phone });
      await business.save({ session });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({
        businessId: business._id,
        email,
        passwordHash,
        emailVerified: true
      });
      await user.save({ session });

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), business._id.toString(), user.role);
      
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await AuthSession.create([{
        userId: user._id,
        businessId: business._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }], { session });

      await session.commitTransaction();
      return { accessToken, refreshToken, setupCompleted: false };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  static async login(email: string, password: string) {
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email, isActive: true });
    if (!user) throw new Error('Incorrect email or password');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Incorrect email or password');

    user.lastLoginAt = new Date();
    await user.save();

    const business = await Business.findById(user.businessId);

    const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.businessId.toString(), user.role);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await AuthSession.create({
      userId: user._id,
      businessId: user.businessId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return { accessToken, refreshToken, setupCompleted: business?.setupCompleted || false };
  }

  static async forgotPassword(email: string) {
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) return; // return silently

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    await OtpVerification.create({
      email,
      purpose: 'PASSWORD_RESET',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await EmailService.sendPasswordResetOtp(email, otp);
  }

  static async verifyResetOtp(email: string, otp: string) {
    email = email.toLowerCase().trim();
    const record = await OtpVerification.findOne({ email, purpose: 'PASSWORD_RESET', consumedAt: null }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) throw new Error('Verification code is incorrect or expired');
    if (record.attempts >= 5) throw new Error('Too many attempts');

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      throw new Error('Verification code is incorrect');
    }

    record.consumedAt = new Date();
    await record.save();

    return jwt.sign({ email, purpose: 'PASSWORD_RESET_COMPLETE' }, config.ACCESS_TOKEN_SECRET || 'fallback_access_secret', { expiresIn: '15m' });
  }

  static async resetPassword(token: string, newPassword: string) {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET || 'fallback_access_secret') as any;
    if (decoded.purpose !== 'PASSWORD_RESET_COMPLETE') throw new Error('Invalid token');
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await AuthSession.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });
  }

  static async refresh(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await AuthSession.findOne({ tokenHash, revokedAt: null });
    if (!session || session.expiresAt < new Date()) throw new Error('Invalid refresh token');

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) throw new Error('User not found or inactive');

    const tokens = this.generateTokens(user._id.toString(), user.businessId.toString(), user.role);
    const newTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    
    session.revokedAt = new Date();
    await session.save();

    await AuthSession.create({
      userId: user._id,
      businessId: user.businessId,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return tokens;
  }

  static async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await AuthSession.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  }
}
