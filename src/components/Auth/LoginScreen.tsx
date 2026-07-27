import React from 'react';
import { Sparkles, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading, authError, clearAuthError } = useAuth();
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleSignIn = async () => {
    setIsConnecting(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 relative">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 mb-4">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            The Tiebreaker
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            AI Multi-Criteria Decision Engine for Complex Choices
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 mb-6 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Structured Multi-Criteria Matrix & Weight Analysis</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>AI Executive Verdicts & Devil's Advocate Insights</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Secure Cloud History & Admin Access Management</span>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-rose-200">
              <p className="font-semibold mb-0.5">Authentication Error</p>
              <p>{authError}</p>
            </div>
            <button 
              onClick={clearAuthError}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading || isConnecting}
          className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          {isConnecting ? (
            <div className="flex items-center gap-2 text-slate-700 text-sm">
              <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              {/* Google Colored Logo SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm">Sign in with Google</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </>
          )}
        </button>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            Protected by Google OAuth & Firebase Security
          </p>
        </div>

      </div>
    </div>
  );
};
