import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ShieldAlert, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('analyst');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => onClose(), 800);
      } else {
        await signup(name, email, password, role);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => onClose(), 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Header Gradient */}
          <div className="p-6 bg-gradient-to-r from-[#131A2B] via-[#1A2338] to-[#0F172A] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isLoginMode ? 'Sign In to AegisDrive' : 'Create Free Account'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isLoginMode ? 'Access protected datasets & predictions' : 'Join the Road Safety AI Platform'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Samrudhi Jadhav"
                      className="w-full bg-[#151E33] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-[#151E33] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#151E33] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Role / Specialization</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#151E33] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="analyst">Data Analyst</option>
                    <option value="traffic_engineer">Traffic Safety Engineer</option>
                    <option value="researcher">Urban Planner / Researcher</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_4px_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{loading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="pt-2 text-center text-xs text-slate-400">
              {isLoginMode ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setError(null);
                    }}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setIsLoginMode(true);
                      setError(null);
                    }}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
