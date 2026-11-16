import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  UserCheck,
  UserX,
  Crown,
  Sparkles
} from 'lucide-react';
import {
  fetchCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  checkUserByEmail,
  getAssetUrl
} from '../../services/api';
import { HEADSHOT_PRESETS } from '../../constants/themes';

export default function AddUsersModal({
  isOpen,
  onClose,
  formId,
  formTitle = 'Form',
  currentUser = null,
  onCollaboratorsUpdated
}) {
  const [collaborators, setCollaborators] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live user verification states
  const [checkingUser, setCheckingUser] = useState(false);
  const [userStatus, setUserStatus] = useState(null); // null | { exists: true, user } | { exists: false, message }

  useEffect(() => {
    if (isOpen && formId) {
      loadCollaborators();
      setEmailInput('');
      setRoleInput('editor');
      setErrorMsg('');
      setSuccessMsg('');
      setUserStatus(null);
    }
  }, [isOpen, formId]);

  // Debounced live user check when email is typed
  useEffect(() => {
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@') || clean.length < 5) {
      setUserStatus(null);
      setCheckingUser(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUser(true);
      try {
        const res = await checkUserByEmail(clean);
        setUserStatus(res);
      } catch (err) {
        setUserStatus({ exists: false, message: 'Could not verify account status' });
      } finally {
        setCheckingUser(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [emailInput]);

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await fetchCollaborators(formId);
      setCollaborators(data.collaborators || []);
      setCreator(data.creator || null);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const clean = emailInput.trim().toLowerCase();
    if (!clean) {
      setErrorMsg('Please enter an email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCollaborator(formId, { email: clean, role: roleInput });
      setCollaborators(res.collaborators || []);
      setEmailInput('');
      setUserStatus(null);
      setSuccessMsg(res.message || 'User successfully added to this form!');
      if (onCollaboratorsUpdated) onCollaboratorsUpdated(res.collaborators);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add user to this form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove "${userName}" from this form?`)) {
      return;
    }

    try {
      const res = await removeCollaborator(formId, userId);
      setCollaborators(res.collaborators || []);
      if (onCollaboratorsUpdated) onCollaboratorsUpdated(res.collaborators);
    } catch (err) {
      alert(`Could not remove user: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await updateCollaboratorRole(formId, userId, newRole);
      setCollaborators(res.collaborators || []);
      if (onCollaboratorsUpdated) onCollaboratorsUpdated(res.collaborators);
    } catch (err) {
      alert(`Could not update role: ${err.message}`);
    }
  };

  const defaultAvatar = HEADSHOT_PRESETS[0].url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface-container-lowest/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-surface-container-low rounded-3xl p-5 sm:p-7 relative flex flex-col gap-5 my-auto border border-outline-variant/30 text-on-surface shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Form Access & Collaboration</span>
            </span>
            <h2 className="font-bold text-lg sm:text-2xl text-on-surface truncate tracking-tight">
              Add Users to Form
            </h2>
            <p className="text-xs text-on-surface-variant line-clamp-1">
              {formTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center border border-outline-variant/30 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Add User Form Section */}
        <div className="bg-surface-container/70 border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Add User with VoxForm Account</span>
            </span>
            <span className="text-[10px] font-mono text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full font-semibold border border-tertiary/20">
              Account Required
            </span>
          </div>

          <form onSubmit={handleAddUser} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              {/* Email Input */}
              <div className="flex-1 flex items-center rounded-xl bg-surface-container-lowest px-3 py-2 border border-outline-variant/30 shadow-inner focus-within:border-primary transition-colors">
                <Mail className="w-4 h-4 text-outline shrink-0 mr-2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email (e.g. colleague@voxform.ai)"
                  className="flex-1 bg-transparent text-on-surface font-mono text-xs sm:text-sm focus:outline-none"
                  required
                />
                {checkingUser && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 ml-1" />
                )}
              </div>

              {/* Role Select Dropdown */}
              <div className="sm:w-36 flex items-center rounded-xl bg-surface-container-lowest px-2.5 py-2 border border-outline-variant/30">
                <Shield className="w-3.5 h-3.5 text-on-surface-variant mr-1.5 shrink-0" />
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Add Button */}
              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Add User</span>
              </button>
            </div>

            {/* Live Verification Feedback Banner */}
            {userStatus && !checkingUser && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 transition-all animate-fadeIn ${
                  userStatus.exists
                    ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                    : 'bg-error-container/20 text-error border border-error-container/30'
                }`}
              >
                {userStatus.exists ? (
                  <>
                    <UserCheck className="w-4 h-4 shrink-0 text-tertiary" />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        ✓ Active VoxForm Account: {userStatus.user?.name || userStatus.user?.email}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tertiary/20">
                        Ready to add
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 shrink-0 text-error" />
                    <span className="font-medium">
                      No VoxForm account found for this email. They must register a VoxForm account first.
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Success & Error messages */}
            {successMsg && (
              <div className="p-2.5 rounded-xl text-xs bg-tertiary/15 text-tertiary border border-tertiary/30 flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-2.5 rounded-xl text-xs bg-error-container/20 text-error border border-error-container/30 flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* 2. People with Access List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
              <span>People with Access</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-bold text-[10px]">
                {1 + (collaborators?.length || 0)}
              </span>
            </span>
            <span className="text-[11px] text-outline font-mono">
              Owners & Team Members
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {/* Form Creator / Owner Row */}
            {creator && (
              <div className="p-3 rounded-2xl bg-surface-container/40 border border-outline-variant/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <img
                      src={getAssetUrl(creator.avatarUrl || defaultAvatar)}
                      alt={creator.name || 'Owner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {creator.name || 'Form Creator'}
                      </p>
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                    <p className="text-[11px] font-mono text-on-surface-variant truncate">
                      {creator.email}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold font-mono">
                  Owner
                </span>
              </div>
            )}

            {/* Collaborators List */}
            {collaborators.map((user) => {
              const avatar = getAssetUrl(user.avatarUrl || defaultAvatar);
              return (
                <div
                  key={user.userId || user.email}
                  className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between gap-3 transition-colors hover:border-outline-variant/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 flex items-center justify-center shrink-0">
                      <img
                        src={avatar}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {user.name || user.email.split('@')[0]}
                      </p>
                      <p className="text-[11px] font-mono text-on-surface-variant truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role Dropdown */}
                    <select
                      value={user.role || 'editor'}
                      onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-surface-container text-[11px] font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {/* Remove Collaborator Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.userId, user.name || user.email)}
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                      title="Remove access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State when no collaborators */}
            {!loading && collaborators.length === 0 && (
              <div className="p-6 rounded-2xl bg-surface-container-lowest/50 border border-dashed border-outline-variant/30 text-center flex flex-col items-center gap-2">
                <Users className="w-6 h-6 text-outline" />
                <p className="text-xs font-semibold text-on-surface">No additional users added yet</p>
                <p className="text-[11px] text-on-surface-variant max-w-sm">
                  Add team members who have a VoxForm account using their email above to let them collaborate on questions, preview, and review responses.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <span className="text-[11px] text-on-surface-variant font-mono">
            Users must have a VoxForm account to be added.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
