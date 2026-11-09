import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  Mic,
  TrendingUp,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Sparkles,
  Download,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { fetchAdminAnalytics, verifyAdminKey } from '../../services/api';

const DEFAULT_KEY = 'vox-owner-secret-2026';

export default function AdminAnalytics({ onBackToDashboard }) {
  const [adminKey, setAdminKey] = useState(() => {
    // Check hash query params or search params
    const hash = window.location.hash || '';
    const hashParamMatch = hash.match(/[?&]key=([^&]+)/);
    if (hashParamMatch) return decodeURIComponent(hashParamMatch[1]);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('key')) return urlParams.get('key');

    return localStorage.getItem('vox_admin_secret_key') || '';
  });

  const [inputKey, setInputKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'has_forms' | 'has_voice' | 'no_forms'
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    if (adminKey) {
      loadData(adminKey);
    }
  }, []);

  const loadData = async (keyToUse) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminAnalytics(keyToUse);
      setData(result);
      setIsUnlocked(true);
      setAdminKey(keyToUse);
      localStorage.setItem('vox_admin_secret_key', keyToUse);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(err.message || 'Invalid admin key. Please verify your credentials.');
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    loadData(inputKey.trim());
  };

  const handleQuickUnlockDefault = () => {
    setInputKey(DEFAULT_KEY);
    loadData(DEFAULT_KEY);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setAdminKey('');
    setData(null);
    localStorage.removeItem('vox_admin_secret_key');
  };

  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copySecretLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const directUrl = `${origin}${path}#admin-analytics?key=${encodeURIComponent(adminKey || DEFAULT_KEY)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const exportCsv = () => {
    if (!data || !data.users) return;
    const rows = [
      ['Creator Name', 'Creator Email', 'Joined Date', 'Forms Created', 'Total Responses Received', 'Voice Responses Received', 'Voice Adoption Rate (%)']
    ];

    data.users.forEach(u => {
      rows.push([
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${new Date(u.createdAt).toLocaleDateString()}"`,
        u.formsCount,
        u.totalResponsesReceived,
        u.voiceResponsesReceived,
        `${u.voiceAdoptionRate}%`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voxform_creator_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered users
  const filteredUsers = (data?.users || []).filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'has_forms') return u.formsCount > 0;
    if (filterType === 'has_voice') return u.voiceResponsesReceived > 0;
    if (filterType === 'no_forms') return u.formsCount === 0;

    return true;
  });

  // Render Lock Gate if not authenticated
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Private Owner Analytics</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Confidential dashboard to track user signups, forms created per user, and voice-to-text dictation metrics.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Secret Access Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter secret admin key..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pl-11"
                />
                <Key className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>{loading ? 'Authenticating...' : 'Unlock Private Dashboard'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickUnlockDefault}
                className="text-[11px] text-slate-400 hover:text-indigo-400 underline transition-colors cursor-pointer"
              >
                Use default owner access key
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
            <span className="text-[11px] font-mono">VoxForm Private Core</span>
          </div>
        </div>
      </div>
    );
  }

  const { overview } = data || {};

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header Bar */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confidential Owner Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform & Creator Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Track real-time signups, form creation count per person, and detailed voice-to-text dictation metrics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copySecretLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-all cursor-pointer shadow-sm"
              title="Copy link with access key"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Secret Link'}</span>
            </button>

            <button
              onClick={() => loadData(adminKey)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleLock}
              className="p-2.5 rounded-2xl bg-slate-700/50 hover:bg-red-900/40 text-slate-400 hover:text-red-300 border border-slate-700 transition-all cursor-pointer"
              title="Lock & Exit Private Analytics"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to App</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Users Signed Up */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Signups</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {overview?.totalUsers ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="text-indigo-400 font-semibold">{overview?.averageFormsPerUser ?? 0}</span>
              <span>forms per user avg</span>
            </div>
          </div>

          {/* Card 2: Total Forms Created */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Forms</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {overview?.totalForms ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Across all creators and templates
            </div>
          </div>

          {/* Card 3: Total Responses */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {overview?.totalResponses ?? 0}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Form answers collected
            </div>
          </div>

          {/* Card 4: Voice-to-Text Usage */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Voice Dictations</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Mic className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {overview?.totalVoiceResponses ?? 0}
              </span>
              <span className="text-sm font-bold text-amber-400">
                ({overview?.overallVoiceAdoptionRate ?? 0}%)
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {overview?.totalVoiceFields ?? 0} voice fields transcribed
            </div>
          </div>
        </div>

        {/* Activity Timeline / Last 7 Days */}
        {data?.activityTimeline && data.activityTimeline.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Activity Over Time (Last 7 Days)</h2>
              </div>
              <span className="text-xs text-slate-400">Daily submissions & voice adoption</span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {data.activityTimeline.map((item, idx) => {
                const total = item.total || 0;
                const voice = item.voice || 0;
                const maxVal = Math.max(1, ...data.activityTimeline.map(t => t.total || 0));
                const heightPercent = Math.min(100, Math.max(12, Math.round((total / maxVal) * 100)));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-900/60 rounded-xl h-32 flex flex-col justify-end p-1.5 relative group">
                      {total > 0 && (
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-lg relative overflow-hidden transition-all flex flex-col justify-end"
                        >
                          {voice > 0 && (
                            <div
                              style={{ height: `${Math.round((voice / total) * 100)}%` }}
                              className="w-full bg-amber-400/90 rounded-b-lg"
                              title={`${voice} voice answers`}
                            />
                          )}
                        </div>
                      )}
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                        <div>Submissions: {total}</div>
                        <div>Voice used: {voice}</div>
                        <div>Forms: {item.formsCreated || 0}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.date ? item.date.slice(5) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span>Total Form Submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-400" />
                <span>Voice Dictation Submissions</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: People Who Signed Up & Forms Created / Voice Used */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Registered Creators & Voice Usage Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect every signed-up user, how many forms they created, and how many people used voice to text on their forms.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Users ({data?.users?.length || 0})
              </button>

              <button
                onClick={() => setFilterType('has_forms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'has_forms'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Created Forms ({data?.users?.filter(u => u.formsCount > 0).length || 0})
              </button>

              <button
                onClick={() => setFilterType('has_voice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'has_voice'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Voice Received ({data?.users?.filter(u => u.voiceResponsesReceived > 0).length || 0})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search creators by name or email address..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-11 transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
          </div>

          {/* Users Table / List */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No matching creators found</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((creator) => {
                const isExpanded = Boolean(expandedUsers[creator.id]);

                return (
                  <div
                    key={creator.id}
                    className="bg-slate-900/70 border border-slate-700/70 rounded-2xl overflow-hidden transition-all hover:border-slate-600"
                  >
                    {/* User Summary Row */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* User Identity */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                            {(creator.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm truncate">
                              {creator.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              {creator.provider || 'email'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {creator.email}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(creator.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stat Metrics for this User */}
                      <div className="grid grid-cols-3 sm:flex items-center gap-3 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                        {/* Forms Created */}
                        <div className="text-center md:text-right">
                          <span className="block text-[11px] text-slate-400 font-medium">Forms Created</span>
                          <span className="text-base font-extrabold text-white">
                            {creator.formsCount}
                          </span>
                        </div>

                        {/* Total Responses */}
                        <div className="text-center md:text-right">
                          <span className="block text-[11px] text-slate-400 font-medium">Total Responses</span>
                          <span className="text-base font-extrabold text-emerald-400">
                            {creator.totalResponsesReceived}
                          </span>
                        </div>

                        {/* Voice Dictation on this User's Forms */}
                        <div className="text-center md:text-right">
                          <span className="block text-[11px] text-amber-300 font-medium flex items-center justify-center md:justify-end gap-1">
                            <Mic className="w-3 h-3 text-amber-400" />
                            <span>Voice Users</span>
                          </span>
                          <span className="text-base font-extrabold text-amber-400">
                            {creator.voiceResponsesReceived}
                            <span className="text-xs text-slate-400 font-normal ml-1">
                              ({creator.voiceAdoptionRate}%)
                            </span>
                          </span>
                        </div>

                        {/* Expand Button */}
                        <button
                          type="button"
                          onClick={() => toggleUserExpanded(creator.id)}
                          className="col-span-3 sm:col-span-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Forms' : `View Forms (${creator.formsCount})`}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Forms Details */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-950/60 border-t border-slate-800/80 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Forms Created by {creator.name} ({creator.forms.length})
                        </h4>

                        {creator.forms.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-900/60 text-center text-xs text-slate-500">
                            This user has not created any forms yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {creator.forms.map((form) => (
                              <div
                                key={form.id}
                                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-white text-sm truncate">
                                      {form.title}
                                    </h5>
                                    <span className="text-[11px] text-slate-500">
                                      Created {new Date(form.createdAt).toLocaleDateString()} • {form.questionCount} questions
                                    </span>
                                  </div>
                                  <a
                                    href={`/#form/${form.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                                    title="Open Responder View"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                  <span className="text-slate-400">
                                    Responses: <strong className="text-white">{form.responseCount}</strong>
                                  </span>
                                  <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                                    <Mic className="w-3 h-3" />
                                    <span>{form.voiceResponseCount} voice ({form.voiceAdoptionRate}%)</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Unassigned / Guest Forms (if any exist) */}
        {data?.unassignedForms && data.unassignedForms.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Guest / Unassigned Forms ({data.unassignedForms.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Forms created by visitors before logging in or created anonymously.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {data.unassignedForms.map((form) => (
                <div
                  key={form.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm truncate">{form.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      Creator: {form.creatorName} • {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Submissions: <strong className="text-white">{form.responseCount}</strong>
                    </span>
                    <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      <span>{form.voiceResponseCount} ({form.voiceAdoptionRate}%)</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
