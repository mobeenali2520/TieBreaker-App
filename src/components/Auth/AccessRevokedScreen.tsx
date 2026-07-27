import React from 'react';
import { ShieldX, LogOut, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccessRevokedScreen: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 relative text-center">
        
        {/* Warning Icon Header */}
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6 shadow-inner">
          <ShieldX className="h-10 w-10 animate-bounce" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Access Disabled
        </h2>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Your access to this application has been disabled by an administrator. You currently do not have permission to use this system.
        </p>

        {userProfile && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mb-6 text-left">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Account Credentials
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate">
              {userProfile.displayName || 'User'}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span>{userProfile.email}</span>
            </div>
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 text-xs text-amber-200 text-left flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            If you believe this is an error or require access restored, please contact your administrator.
          </span>
        </div>

        <button
          onClick={logout}
          className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>

      </div>
    </div>
  );
};
