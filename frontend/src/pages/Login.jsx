// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleIcon from '../components/common/GoogleIcon';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsAnimating(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      setIsAnimating(false);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleFormSwitch = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setIsAnimating(true);
    }, 300);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, { name, role, email });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-black/5 to-gray-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-900/5 to-black/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-black/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}

        {/* Interactive Gradient Following Mouse */}
        <div 
          className="absolute w-96 h-96 bg-gradient-radial from-black/5 via-transparent to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Illustration & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Premium Black Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-b from-black via-gray-800 to-black shadow-2xl"></div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-12 bg-gradient-to-br from-gray-50 to-white relative">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}></div>
            </div>

            {/* Company Branding */}
            <div className="absolute top-8 left-12 flex items-center space-x-3 z-20">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="QuantAI" 
                  className="h-10 w-10 drop-shadow-lg"
                />
                <div className="absolute -inset-2 bg-black/5 rounded-full blur-md animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black tracking-tight">QuantAI</h1>
                <p className="text-xs text-gray-600 font-medium">Skill Assessment Platform</p>
              </div>
            </div>

            {/* Main Illustration */}
            <div className="relative z-10 transform hover:scale-105 transition-all duration-700 ease-out">
              <div className="absolute -inset-8 bg-gradient-to-r from-black/10 via-transparent to-black/10 rounded-full blur-2xl"></div>
              <img 
                src="/banda.png" 
                alt="Welcome Illustration" 
                className="max-w-md w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Premium Quote */}
            <div className="mt-8 text-center max-w-md">
              <blockquote className="text-gray-700 text-lg font-medium italic leading-relaxed">
                "Excellence in assessment, precision in evaluation"
              </blockquote>
              <div className="mt-3 flex justify-center">
                <Sparkles className="h-5 w-5 text-black/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Premium Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div className={`w-full max-w-md transform transition-all duration-700 ease-out ${
            isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <img src="/logo.png" alt="QuantAI" className="h-8 w-8" />
              <span className="text-xl font-bold text-black">QuantAI</span>
            </div>

            {/* Form Header */}
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-black mb-3 tracking-tight">
                {isSignUp ? 'Join QuantAI' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                {isSignUp 
                  ? 'Create your account and start your assessment journey' 
                  : 'Hello, friend! I\'m Smartline - task manager you can trust everything. Let\'s get in touch.'
                }
              </p>
            </div>

            {/* Premium Form Container */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-gray-50/30 rounded-3xl"></div>
              
              <form className="relative space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm animate-shake backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      {error}
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="group">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-black transition-colors duration-300" />
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="pl-12 w-full px-4 py-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 focus:bg-white transition-all duration-300 backdrop-blur-sm"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="role" className="block text-sm font-semibold text-gray-800 mb-2">
                        I am a:
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors duration-300">
                          {role === 'candidate' ? <GraduationCap className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                        </div>
                        <select
                          id="role"
                          name="role"
                          required
                          className="pl-12 w-full px-4 py-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 focus:bg-white appearance-none transition-all duration-300 backdrop-blur-sm cursor-pointer"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          <option value="candidate">Candidate/Developer</option>
                          <option value="interviewer">Interviewer/Company</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="group">
                  <label htmlFor="email-address" className="block text-sm font-semibold text-gray-800 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-black transition-colors duration-300" />
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="pl-12 w-full px-4 py-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 focus:bg-white transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-black transition-colors duration-300" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="pl-12 pr-12 w-full px-4 py-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 focus:bg-white transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-all duration-300 p-1 rounded-lg hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Premium Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 bg-black hover:bg-gray-900 text-white font-semibold rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {loading ? (
                    <div className="relative flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      <span>{isSignUp ? 'Creating Your Account...' : 'Signing You In...'}</span>
                    </div>
                  ) : (
                    <div className="relative flex items-center">
                      <span className="mr-2">{isSignUp ? 'Create Account' : "Let's Start!"}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-600 font-medium">Or continue with</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="group flex items-center justify-center p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-60 min-w-[120px]"
                  >
                    <GoogleIcon className="h-6 w-6 mr-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-black">Google</span>
                  </button>
                  
                  {/* <button
                    type="button"
                    className="group flex items-center justify-center p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg min-w-[120px]"
                  >
                    <svg className="h-6 w-6 mr-2 text-gray-700 group-hover:text-black transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-black">Twitter</span>
                  </button> */}
                </div>

                {/* Form Switch */}
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={handleFormSwitch}
                    className="text-gray-600 hover:text-black text-sm transition-colors duration-300 font-medium"
                  >
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span className="text-black font-semibold underline decoration-2 underline-offset-2 hover:decoration-4 transition-all duration-300">
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Premium Footer */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-gray-50/80 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm">
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="font-medium">Proof of Concept</span>
                  <span className="mx-2">•</span>
                  <span>Not for production use</span>
                  <span className="mx-2">•</span>
                  <span>Temporary demonstration only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.3; 
          }
          33% { 
            transform: translateY(-20px) translateX(10px) rotate(120deg); 
            opacity: 0.8; 
          }
          66% { 
            transform: translateY(10px) translateX(-10px) rotate(240deg); 
            opacity: 0.5; 
          }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}