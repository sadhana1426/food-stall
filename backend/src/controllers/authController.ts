import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export const signupStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, businessName, address, phone } = req.body;
    await AuthService.signupStart(email, businessName, address, phone);
    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error) {
    next(error);
  }
};

export const signupVerifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const token = await AuthService.signupVerifyOtp(email, otp);
    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
};

export const signupComplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password, businessName, address, phone } = req.body;
    const data = await AuthService.signupComplete(token, password, businessName, address, phone);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const data = await AuthService.login(email, password);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    res.json({ success: true, data: { message: 'If an account exists for this email, an OTP has been sent.' } });
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const token = await AuthService.verifyResetOtp(email, otp);
    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refresh(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};
