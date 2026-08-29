import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { confirmToast } from '../lib/confirmToast';
import { AppSelect } from '../components/AppSelect';
import {
  Clock,
  HardDrive,
  Users,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Plus,
  Mail,
  ShieldAlert,
  UserPlus
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    products,
    sales,
    purchases,
    suppliers,
    users,
    currentUser,
    deleteUser,
    updateUserRole,
    registerUser
  } = useInventory();

  // Create new user inside admin panel state
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('administrator');
  const [newRole, setNewRole] = useState<'Administrator' | 'Manager' | 'Salesman'>('Salesman');
  
  const [panelError, setPanelError] = useState('');
  const [panelSuccess, setPanelSuccess] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setPanelError('');
    setPanelSuccess('');

    if (!newFullName.trim() || !newUsername.trim() || !newEmail.trim()) {
      setPanelError('Please fill in full name, username, and email.');
      return;
    }

    const created = registerUser(newFullName, newUsername, newEmail, newPassword, newRole);
    if (!created) {
      setPanelError('Username or email already exists.');
    } else {
      setPanelSuccess(`User "${newUsername}" registered successfully!`);
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('administrator');
      setNewRole('Salesman');
    }
  };

  // System audit log
  const auditLogs = [
    { id: 'log-1', timestamp: '2026-07-06T08:12:00Z', user: 'Administrator', action: 'Modified SKU pricing for S24 Ultra', ip: '192.168.1.104' },
    { id: 'log-2', timestamp: '2026-07-06T07:44:00Z', user: 'Administrator', action: 'Completed POS synchronization', ip: '192.168.1.104' },
    { id: 'log-3', timestamp: '2026-07-06T05:22:00Z', user: 'Emma Watson', action: 'Initiated supplier inventory dispatch', ip: '10.0.4.15' },
    { id: 'log-4', timestamp: '2026-07-05T18:15:00Z', user: 'Administrator', action: 'Overrode low stock alert threshold', ip: '192.168.1.104' }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Minimal page header */}
      <div className="mobile-page-header">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Admin Console</h3>
        <span className="mobile-page-description text-[10px] text-slate-400 block -mt-0.5">Manage staff accounts, roles, and registers</span>
      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: Admin and Register Users List */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 lg:col-span-2 flex flex-col min-w-0">
          <div>
            <h4 className="font-bold text-sm text-slate-800">Store Staff & Registers</h4>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Manage authorization profiles and switch sessions on the fly</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {users.map((user) => {
              const isActiveUser = currentUser?.id === user.id;
              return (
                <div key={user.id} className="py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 min-w-0">
                  
                  {/* Left block: User Profile */}
                  <div className="flex items-center space-x-3.5 min-w-0 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 uppercase ${
                      isActiveUser ? 'bg-blue-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {user.fullName.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 capitalize break-all">{user.fullName}</span>
                        {isActiveUser && (
                          <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center">
                            <span className="w-1 h-1 rounded-full bg-blue-500 mr-1 animate-pulse"></span>
                            Logged In
                          </span>
                        )}
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase ${
                          user.role === 'Administrator' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          user.role === 'Manager' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center mt-0.5 break-all">
                        <Mail className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {user.username} · {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Right block: Action control */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    
                    {/* Role changer dropdown */}
                    <AppSelect
                      value={user.role}
                      onChange={(e: any) => {
                        const nextRole = e.target.value;
                        confirmToast(`Change ${user.username || 'this user'} role to ${nextRole}?`, () => {
                          updateUserRole(user.id, nextRole);
                        });
                      }}
                      className="admin-role-select flex-1 min-w-0 sm:flex-none sm:w-[140px]"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Manager">Manager</option>
                      <option value="Salesman">Salesman</option>
                    </AppSelect>

                    {/* Delete User */}
                    <button
                      onClick={() => {
                        if (isActiveUser) return;
                        confirmToast(`Are you sure you want to delete the staff account for ${user.username || 'this user'}?`, () => {
                          deleteUser(user.id);
                        });
                      }}
                      disabled={isActiveUser}
                      title="Remove staff member"
                      className={`w-9 h-9 flex-shrink-0 rounded-lg border transition-all flex items-center justify-center ${
                        isActiveUser
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                          : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100/60 cursor-pointer'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Register Profile Card */}
        <div className="space-y-6 w-full min-w-0">
          
          {/* Quick Register User Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 w-full">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Add Staff Account</h4>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Provision fresh credentials for single store</span>
            </div>

            {panelError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-semibold rounded-lg text-center">
                {panelError}
              </div>
            )}
            {panelSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold rounded-lg text-center">
                {panelSuccess}
              </div>
            )}

            {!(currentUser?.role === 'Administrator' || currentUser?.role === 'Manager') ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">Access Restricted</p>
                <p className="text-[10px] text-slate-400">Only Administrator & Manager accounts can provision new users.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_doe"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@dreamspos.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set account password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Store Role</label>
                  <AppSelect
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full"
                  >
                    <option value="Administrator">Administrator (Full System Access)</option>
                    <option value="Manager">Manager (Inventory + Reports)</option>
                    <option value="Salesman">Salesman (POS access only)</option>
                  </AppSelect>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Staff Account</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* System Audit Log */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-sm text-slate-800">Security & Operational Audit Log</h4>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Immutable records of store interventions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Operator</th>
                <th className="pb-3">Action Event</th>
                <th className="pb-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-slate-700">{log.user}</td>
                  <td className="py-3 text-slate-800 font-medium">{log.action}</td>
                  <td className="py-3 text-right font-mono text-slate-400 text-[10px]">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
