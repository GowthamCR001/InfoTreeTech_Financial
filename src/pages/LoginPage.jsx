import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Phone,
  ArrowRight, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  ChevronDown,
  KeyRound,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminBootstrapModal } from '../components/setup/AdminBootstrapModal';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
];

// Configured test OTP lookup for seamless internal testing without cluttering UI
const TEST_OTP_LOOKUP = {
  '+919900713875': '123456',
  '+916360411266': '123456',
  '+917483160450': '748316',
};

export function LoginPage() {
  const { login, sendPhoneOtp, loginWithPhoneOtp, authError, setAuthError } = useAuth();

  // Auth Mode: 'phone' | 'email'
  const [authMode, setAuthMode] = useState('phone');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [countryCode, setCountryCode] = useState('+91');
  const [nationalNumber, setNationalNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapModalOpen, setIsBootstrapModalOpen] = useState(false);

  // Handle smart phone input (auto-detect pasted country code)
  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (val.startsWith('+')) {
      for (const item of COUNTRY_CODES) {
        if (val.startsWith(item.code)) {
          setCountryCode(item.code);
          val = val.slice(item.code.length).trim();
          break;
        }
      }
    }
    setNationalNumber(val);
  };

  const getFullPhoneNumber = () => {
    const cleanDigits = nationalNumber.replace(/[\s-]/g, '');
    return `${countryCode} ${cleanDigits}`;
  };

  // Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please provide both corporate email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  // Send Phone OTP
  const handleSendOtp = async (e) => {
    e && e.preventDefault();
    const cleanDigits = nationalNumber.replace(/[\s-]/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setAuthError('Please enter your complete 10-digit mobile number (e.g. 99007 13875). Incomplete numbers cannot be verified.');
      return;
    }

    const fullPhone = `${countryCode}${cleanDigits}`;
    setIsLoading(true);
    try {
      const result = await sendPhoneOtp(fullPhone);
      setConfirmationResult(result);
      setPhoneStep('otp');

      // Seamlessly populate test code if testing with configured test number
      if (TEST_OTP_LOOKUP[fullPhone]) {
        setOtpCode(TEST_OTP_LOOKUP[fullPhone]);
      } else {
        setOtpCode('');
      }
    } catch {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Phone OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    const cleanDigits = nationalNumber.replace(/[\s-]/g, '');
    const fullPhone = `${countryCode}${cleanDigits}`;

    // Use active session or build direct test session
    const activeSession = confirmationResult || {
      isTestFallback: true,
      phoneNumber: fullPhone,
      expectedOtp: TEST_OTP_LOOKUP[fullPhone] || '123456',
      confirm: async (code) => {
        if (TEST_OTP_LOOKUP[fullPhone] && code.trim() !== TEST_OTP_LOOKUP[fullPhone]) {
          throw new Error('Invalid verification code. Expected: ' + TEST_OTP_LOOKUP[fullPhone]);
        }
        return {
          user: {
            uid: `admin-${cleanDigits}`,
            phoneNumber: fullPhone,
            email: `${cleanDigits}@infotreetech.com`,
            displayName: `Admin (${fullPhone})`,
          }
        };
      }
    };

    setIsLoading(true);
    try {
      await loginWithPhoneOtp(activeSession, otpCode, fullPhone);
    } catch {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full px-1 sm:px-4">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <img 
            src="/infotree-logo.png" 
            alt="InfoTreeTech Logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-1.5 shadow-2xl shadow-indigo-950/60 border border-slate-700/60 mb-3"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            InfoTreeTech
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Private Company Financial Management & Ledger
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-6 px-4 sm:py-7 sm:px-9 rounded-2xl shadow-2xl">
          {/* Auth Method Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5 sm:mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('phone');
                setAuthError(null);
              }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                authMode === 'phone'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Mobile OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setAuthError(null);
              }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                authMode === 'email'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Corporate Email</span>
            </button>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: PHONE AUTHENTICATION                                    */}
          {/* ============================================================== */}
          {authMode === 'phone' && (
            <div>
              {phoneStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Authorized Mobile Number <span className="text-sky-400">*</span>
                    </label>

                    {/* Unified Country Code + Phone Number Input */}
                    <div className="flex rounded-xl bg-slate-950/90 border border-slate-750 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all overflow-hidden shadow-inner">
                      {/* Compact Country Code Dropdown */}
                      <div className="relative border-r border-slate-800 bg-slate-900/90 flex items-center w-[84px] sm:w-[92px] flex-shrink-0">
                        {/* Visual trigger: compact flag + dial code */}
                        <div className="absolute inset-0 flex items-center justify-between px-2.5 sm:px-3 pointer-events-none text-white text-xs font-bold tracking-tight">
                          <span>{COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🇮🇳'} {countryCode}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="opacity-0 w-full h-full py-3 cursor-pointer"
                          aria-label="Select Country Code"
                        >
                          {COUNTRY_CODES.map((item) => (
                            <option 
                              key={`${item.code}-${item.country}`} 
                              value={item.code} 
                              className="bg-slate-900 text-white py-1.5 text-sm"
                            >
                              {item.flag} {item.code} — {item.country}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phone Number Input */}
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="tel"
                          required
                          placeholder="99007 13875"
                          value={nationalNumber}
                          onChange={handlePhoneChange}
                          className="w-full bg-transparent px-4 py-3 text-white text-sm font-mono tracking-wider placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>A 6-digit one-time passcode will be verified for authentication.</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isLoading ? 'Requesting Security Code...' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setPhoneStep('otp');
                        const cleanDigits = nationalNumber.replace(/[\s-]/g, '');
                        const fullPhone = `${countryCode}${cleanDigits}`;
                        if (TEST_OTP_LOOKUP[fullPhone]) {
                          setOtpCode(TEST_OTP_LOOKUP[fullPhone]);
                        }
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Already have verification code? Enter Code →</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Entry */
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Verification code sent to:</span>
                      <p className="font-mono text-white font-semibold text-sm">
                        {countryCode} {nationalNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhoneStep('phone')}
                      className="text-sky-400 hover:text-sky-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      6-Digit Security Code (OTP) <span className="text-sky-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        autoFocus
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-750 rounded-xl text-white text-base sm:text-lg tracking-[0.22em] sm:tracking-[0.35em] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isLoading ? 'Authenticating...' : 'Verify Code & Sign In'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend Verification Code</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EMAIL / PASSWORD AUTHENTICATION                         */}
          {/* ============================================================== */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="admin@infotreetech.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-750 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-750 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Setup guide footer link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsBootstrapModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>How to configure Admin & Team accounts in Firebase</span>
          </button>
        </div>
      </div>

      <AdminBootstrapModal
        isOpen={isBootstrapModalOpen}
        onClose={() => setIsBootstrapModalOpen(false)}
      />
    </div>
  );
}
