import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUser, login, verify2FA, error, loading } = useAdminAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  // UI states
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser && !showTwoFactor) {
      navigate('/admin/dashboard');
    }
  }, [adminUser, showTwoFactor, navigate]);

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Basic validation
    if (!email || !password) {
      setLocalError('Please enter email and password');
      return;
    }

    try {
      const result = await login(email, password);

      if (result.requiresTwoFactor) {
        // Show 2FA input
        setShowTwoFactor(true);
        setPendingEmail(email);
        setSuccessMessage('Please enter your 2FA code');
      } else if (result.success) {
        // Direct login success (no 2FA)
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      const message = err.message || 'Login failed';

      // Handle specific error cases
      if (message.includes('locked')) {
        setIsLocked(true);
        setLocalError('Account locked due to multiple failed attempts. Please try again in 30 minutes.');
        setFailedAttempts(5);
      } else if (message.includes('Invalid') || message.includes('incorrect')) {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);

        if (attempts >= 3) {
          setLocalError(`Invalid credentials. ${5 - attempts} attempts remaining before account lock.`);
        } else {
          setLocalError('Invalid email or password');
        }
      } else {
        setLocalError(message);
      }
    }
  };

  // Handle 2FA verification
  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await verify2FA(pendingEmail, twoFactorCode);

      if (result.success) {
        // Store remember device preference if needed
        if (rememberDevice && result.sessionToken) {
          localStorage.setItem('admin_device_trusted', 'true');
        }

        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setLocalError(err.message || '2FA verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-900/20 backdrop-blur-sm rounded-full mb-4 border border-red-900/30">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Secure administrative access</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-8">
          {!showTwoFactor ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  placeholder="admin@civicnotices.co.uk"
                  disabled={loading || isLocked}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  disabled={loading || isLocked}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Remember Device */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 bg-gray-900 border-gray-600 rounded text-red-600 focus:ring-red-600"
                  disabled={loading || isLocked}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                  Remember this device
                </label>
              </div>

              {/* Error Message */}
              {(localError || error) && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{localError || error}</p>
                </div>
              )}

              {/* Failed Attempts Warning */}
              {failedAttempts > 0 && failedAttempts < 5 && !isLocked && (
                <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-400">
                    {5 - failedAttempts} login attempts remaining
                  </p>
                </div>
              )}

              {/* Account Locked Message */}
              {isLocked && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
                  <Lock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Account Locked</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Too many failed login attempts. Please try again in 30 minutes or contact a super admin.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLocked
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2FA Form */
            <form onSubmit={handle2FAVerification} className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-400">{successMessage}</p>
                </div>
              )}

              {/* 2FA Instructions */}
              <div className="text-center">
                <Lock className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {/* 2FA Code Input */}
              <div>
                <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="2fa-code"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(value);
                  }}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-wider placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  placeholder="000000"
                  maxLength={6}
                  pattern="\d{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  disabled={loading}
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the code from Google Authenticator or similar app
                </p>
              </div>

              {/* Error Message */}
              {(localError || error) && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{localError || error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    twoFactorCode.length !== 6
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFactor(false);
                    setTwoFactorCode('');
                    setPendingEmail('');
                    setSuccessMessage('');
                  }}
                  className="w-full py-3 px-4 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
                >
                  Back to Login
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-center text-gray-500">
                Lost your device? Contact a super admin for assistance.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Civic Notices Admin Portal • Enterprise Security
          </p>
          <p className="text-xs text-gray-600 mt-2">
            All login attempts are logged and monitored
          </p>
        </div>
      </div>
    </div>
  );
}