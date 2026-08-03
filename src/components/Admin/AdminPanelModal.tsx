import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  RefreshCw,
  Shield,
  Check,
  Ban,
  RotateCcw
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, AdminStats } from '../../types/user';
import { useAuth } from '../../context/AuthContext';

import { useAppStore } from '../../store/useAppStore';

interface AdminPanelModalProps {}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = () => {
  const { showAdminPanel: isOpen, setShowAdminPanel } = useAppStore();
  const onClose = () => setShowAdminPanel(false);
  
  const { userProfile, updateUserAccess, updateUserRole } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  
  // Modal for confirmation
  const [confirmTarget, setConfirmTarget] = useState<{
    user: UserProfile;
    action: 'revoke' | 'restore';
  } | null>(null);
  
  const [actionProcessing, setActionProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingUsers(true);
    const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        console.error("Error fetching users list for admin panel:", err);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Stats calculation
  const stats: AdminStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    revokedUsers: users.filter(u => u.status === 'revoked').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;

    setActionProcessing(true);
    setActionError(null);

    try {
      const newStatus = confirmTarget.action === 'revoke' ? 'revoked' : 'active';
      await updateUserAccess(confirmTarget.user.uid, newStatus);
      setConfirmTarget(null);
    } catch (err: any) {
      console.error("Action error:", err);
      setActionError(err?.message || "Failed to update user access status.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (user.uid === userProfile?.uid) {
      alert("You cannot change your own admin role.");
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(user.uid, newRole);
    } catch (err) {
      alert("Failed to update user role.");
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                User Access Management
                <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                  Admin Panel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                View registered users, grant/revoke access permissions, and monitor activity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Total Users</div>
                <div className="text-xl font-extrabold text-white">{stats.totalUsers}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Active Access</div>
                <div className="text-xl font-extrabold text-emerald-400">{stats.activeUsers}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Revoked Access</div>
                <div className="text-xl font-extrabold text-rose-400">{stats.revokedUsers}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Administrators</div>
                <div className="text-xl font-extrabold text-purple-400">{stats.adminUsers}</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Active ({stats.activeUsers})
              </button>
              <button
                onClick={() => setStatusFilter('revoked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'revoked'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Revoked ({stats.revokedUsers})
              </button>
            </div>

          </div>

          {/* Users Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            {loadingUsers ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="text-xs font-medium">Loading user database...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No users found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search query or filter settings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">User Profile</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Account Created</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const isCurrentUser = u.uid === userProfile?.uid;
                      const isRevoked = u.status === 'revoked';

                      return (
                        <tr 
                          key={u.uid} 
                          className={`hover:bg-slate-900/60 transition-colors ${
                            isRevoked ? 'bg-rose-950/10' : ''
                          }`}
                        >
                          {/* User Profile */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.displayName}
                                  className="h-9 w-9 rounded-full border border-slate-700 object-cover shrink-0"
                                  onError={(e) => {
                                    // Fallback to avatar letter on image load error
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                              {!u.photoURL && (
                                <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                                  {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                                  <span className="truncate">{u.displayName || 'Anonymous User'}</span>
                                  {isCurrentUser && (
                                    <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isCurrentUser}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                u.role === 'admin'
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                              } ${isCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
                              title={isCurrentUser ? "You cannot change your own role" : "Click to toggle Admin / User role"}
                            >
                              <Shield className="h-3 w-3" />
                              <span className="capitalize">{u.role}</span>
                            </button>
                          </td>

                          {/* Account Creation Date */}
                          <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{formatDate(u.createdAt)}</span>
                            </div>
                          </td>

                          {/* Last Login Time */}
                          <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{formatDate(u.lastLogin)}</span>
                            </div>
                          </td>

                          {/* Current Access Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {isRevoked ? (
                              <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <Ban className="h-3 w-3" />
                                Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <Check className="h-3 w-3" />
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {isCurrentUser ? (
                              <span className="text-[11px] text-slate-500 italic">Self</span>
                            ) : isRevoked ? (
                              <button
                                onClick={() => setConfirmTarget({ user: u, action: 'restore' })}
                                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 ml-auto transition-all shadow-sm"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore Access
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmTarget({ user: u, action: 'revoke' })}
                                className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 ml-auto transition-all shadow-sm"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>Displaying {filteredUsers.length} of {users.length} total user accounts</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Confirmation Dialog Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shrink-0 ${
                confirmTarget.action === 'revoke' 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {confirmTarget.action === 'revoke' ? 'Confirm Access Revocation' : 'Confirm Access Restoration'}
                </h3>
                <p className="text-xs text-slate-400">
                  {confirmTarget.action === 'revoke'
                    ? 'User will immediately lose access to the application.'
                    : 'User access will be restored immediately.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-semibold text-white">
                {confirmTarget.user.displayName || 'User'}
              </div>
              <div className="text-xs text-slate-400">
                {confirmTarget.user.email}
              </div>
            </div>

            {actionError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmTarget(null)}
                disabled={actionProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={actionProcessing}
                className={`px-4 py-2 font-semibold rounded-xl text-xs text-white transition-all flex items-center gap-2 ${
                  confirmTarget.action === 'revoke'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30'
                }`}
              >
                {actionProcessing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {confirmTarget.action === 'revoke' ? 'Yes, Revoke Access' : 'Yes, Restore Access'}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
