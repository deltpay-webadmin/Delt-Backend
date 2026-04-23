import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Zap } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LoginProps {
  onLogin: (email: string, name: string, role: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo credentials
  const demoUsers = {
    'demo@deltpay.com': {
      password: 'demo123',
      name: 'Patrick Johnson',
      role: 'Admin'
    },
    'patrick@deltpay.com': {
      password: 'DeltPay2024!',
      name: 'Patrick Johnson',
      role: 'Admin'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate credentials
      const user = demoUsers[email as keyof typeof demoUsers];
      
      if (!user || user.password !== password) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Fetch user profile from database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/user/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const result = await response.json();
      
      if (result.success && result.user) {
        console.log('[Login] User profile loaded from database:', result.user);
        onLogin(result.user.email, result.user.name, result.user.role);
      } else {
        // Fallback to default if database fetch fails
        onLogin(email, user.name, user.role);
      }
    } catch (err) {
      console.error('[Login] Error fetching user profile:', err);
      // Fallback to default credentials
      const user = demoUsers[email as keyof typeof demoUsers];
      onLogin(email, user.name, user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@deltpay.com');
    setPassword('demo123');
    setError('');
  };

  const quickLogin = () => {
    setEmail('demo@deltpay.com');
    setPassword('demo123');
    setError('');
    // Trigger login automatically
    setTimeout(() => {
      const user = demoUsers['demo@deltpay.com'];
      onLogin('demo@deltpay.com', user.name, user.role);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
            <span className="text-white text-2xl sm:text-3xl font-bold">D</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Delt Pay</h1>
          <p className="text-sm sm:text-base text-gray-600">MCA Loan Tracking Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Testing Mode</p>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            {/* Quick Login Button */}
            <button
              type="button"
              onClick={quickLogin}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-3"
            >
              <Zap className="w-4 h-4" />
              <span>Quick Demo Login</span>
            </button>

            {/* Manual Fill Button */}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            >
              Fill Demo Credentials
            </button>
            
            {/* Credentials Display */}
            <div className="mt-3 text-xs sm:text-sm bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-3 sm:p-4 rounded-lg space-y-1.5">
              <p className="font-semibold text-purple-900 mb-2">Demo Account Credentials:</p>
              <div className="space-y-1">
                <p className="text-purple-800">
                  <span className="font-medium">Email:</span> demo@deltpay.com
                </p>
                <p className="text-purple-800">
                  <span className="font-medium">Password:</span> demo123
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
          © 2024 Delt Pay. All rights reserved.
        </p>
      </div>
    </div>
  );
}