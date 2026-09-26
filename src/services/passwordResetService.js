// StockSense Password Reset Service with Mock OTP

const DEMO_OTP = '123456';
const otpStore = new Map(); // email -> { otp, expiresAt }

class PasswordResetService {
  requestOtp(email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          reject(new Error('Please enter a valid registered email address.'));
          return;
        }

        // Store OTP with 10-minute expiry
        otpStore.set(cleanEmail, {
          otp: DEMO_OTP,
          expiresAt: Date.now() + 10 * 60 * 1000
        });

        resolve({
          success: true,
          email: cleanEmail,
          demoOtp: DEMO_OTP,
          message: `Verification code sent to ${cleanEmail}`
        });
      }, 350);
    });
  }

  verifyOtp(email, otp) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const record = otpStore.get(cleanEmail);

        if (!record) {
          reject(new Error('No OTP request found. Please request a new verification code.'));
          return;
        }

        if (Date.now() > record.expiresAt) {
          otpStore.delete(cleanEmail);
          reject(new Error('Verification code has expired. Please request a new code.'));
          return;
        }

        if (record.otp !== (otp || '').trim() && (otp || '').trim() !== '123456') {
          reject(new Error('Invalid verification code. Please check and try again.'));
          return;
        }

        resolve({ success: true, verified: true });
      }, 300);
    });
  }

  resetPassword(email, newPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanEmail = (email || '').trim().toLowerCase();
        otpStore.delete(cleanEmail);
        resolve({ success: true });
      }, 350);
    });
  }
}

export const passwordResetService = new PasswordResetService();
