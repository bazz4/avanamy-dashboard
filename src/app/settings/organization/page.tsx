'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Mail, UserPlus, Trash2, Shield, Users, Clock, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  user_email: string | null;
  user_name: string | null;
  joined_at: string | null;
}

interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_by_name: string | null;
  created_at: string;
  expires_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).Clerk) {
    try {
      const token = await (window as any).Clerk.session?.getToken();
      return token || '';
    } catch (e) {
      console.error('Failed to get Clerk token:', e);
      return '';
    }
  }
  return '';
}

export default function OrganizationSettingsPage() {
  const { isLoaded } = useAuth();
  const pathname = usePathname(); 
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs = [
    { name: 'Profile', href: '/settings', icon: UserIcon },
    { name: 'Organization', href: '/settings/organization', icon: Users },
  ];

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [isLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await getClerkToken();
      
      const [membersRes, invitationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/organizations/current/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/organizations/current/invitations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (!membersRes.ok) throw new Error('Failed to load members');
      if (!invitationsRes.ok) throw new Error('Failed to load invitations');
      
      setMembers(await membersRes.json());
      setInvitations(await invitationsRes.json());
      setError(null);
    } catch (err) {
      console.error('Failed to load organization data:', err);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      const token = await getClerkToken();
      const res = await fetch(`${API_BASE_URL}/api/organizations/current/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to send invitation');
      }
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('developer');
      await loadData();
      alert('Invitation sent successfully!');
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      alert(err.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (!confirm(`Are you sure you want to remove ${member.user_name || member.user_email || 'this member'}?`)) {
      return;
    }
    
    try {
      const token = await getClerkToken();
      const res = await fetch(`${API_BASE_URL}/api/organizations/current/members/${member.user_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to remove member');
      }
      
      await loadData();
      alert('Member removed successfully');
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const token = await getClerkToken();
      const res = await fetch(`${API_BASE_URL}/api/organizations/current/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to revoke invitation');
      }

      await loadData();
      alert('Invitation revoked');
    } catch (err: any) {
      console.error('Failed to revoke invitation:', err);
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'developer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors
                  ${isActive 
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon size={18} />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Invite Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={20} />
          Invite Member
        </button>
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Team Members ({members.length})
            </h2>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No members found
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(member.user_name?.[0] || member.user_email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.user_name || member.user_email || 'Unknown User'}
                    </div>
                    {member.user_email && member.user_name && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.user_email}</div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Joined {formatDate(member.joined_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                  
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending Invitations ({invitations.length})
              </h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Mail size={24} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{invitation.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Invited by {invitation.invited_by_name || 'Team member'}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Expires {formatDate(invitation.expires_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(invitation.role)}`}>
                    {invitation.role}
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                    Pending
                  </span>
                  <button
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Revoke invitation"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="developer">Developer - Can view and trigger scans</option>
                  <option value="admin">Admin - Full access except billing</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Invitation will expire in 7 days
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}