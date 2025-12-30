import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Download, Settings, Upload, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { AVATAR_PLACEHOLDER } from '../constants';
import type { ExportDeploymentTarget } from '../services/exportService';
import ImageCropModal from './ImageCropModal';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: (next: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  activeBentoId?: string;
  deployTarget: ExportDeploymentTarget;
  setDeployTarget: (target: ExportDeploymentTarget) => void;
  analyticsAdminToken: string;
  setAnalyticsAdminToken: (token: string) => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  setProfile,
  activeBentoId,
  deployTarget,
  setDeployTarget,
  analyticsAdminToken,
  setAnalyticsAdminToken,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);

  const analyticsSupabaseUrl = useMemo(() => {
    return profile.analytics?.supabaseUrl?.trim().replace(/\/+$/, '') || '';
  }, [profile.analytics?.supabaseUrl]);

  const analyticsTrackEndpoint = analyticsSupabaseUrl
    ? `${analyticsSupabaseUrl}/functions/v1/openbento-analytics-track`
    : '';

  const analyticsAdminEndpoint = analyticsSupabaseUrl
    ? `${analyticsSupabaseUrl}/functions/v1/openbento-analytics-admin`
    : '';

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      setPendingAvatarSrc(result);
    };
    reader.readAsDataURL(file);

    try {
      e.target.value = '';
    } catch {
      // ignore
    }
  };

  const resetAvatar = () => setProfile({ ...profile, avatarUrl: AVATAR_PLACEHOLDER });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden ring-1 ring-gray-900/5"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
          >
            <div className="p-8 pb-6 flex justify-between items-start border-b border-gray-100">
              <div>
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white mb-4">
                  <Settings size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 mt-1 text-sm">Configure profile, branding, analytics and deploy defaults.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                aria-label="Close settings"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 pt-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Profile */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile</h3>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 ring-2 ring-white shadow-lg">
                      <img src={profile.avatarUrl || AVATAR_PLACEHOLDER} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                      >
                        <Upload size={14} />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={resetAvatar}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Name</label>
                      <input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-semibold text-gray-800"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium text-gray-700 h-24 resize-none"
                        placeholder="A short bio…"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Branding */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Branding</h3>
                <div className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-2xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Show OpenBento credit</p>
                    <p className="text-xs text-gray-400">Displays the OpenBento footer in the builder and export.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, showBranding: !(profile.showBranding !== false) })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      profile.showBranding !== false ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                    aria-pressed={profile.showBranding !== false}
                    aria-label="Toggle OpenBento branding"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        profile.showBranding !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* Analytics */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Analytics (Supabase)</h3>
                  <span className="text-[11px] text-gray-400 inline-flex items-center gap-2">
                    <BarChart3 size={14} />
                    Dashboard available in Builder
                  </span>
                </div>

                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Enable analytics</p>
                      <p className="text-xs text-gray-400">Tracks inbound page views and outbound clicks on the exported page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          analytics: {
                            ...(profile.analytics ?? {}),
                            enabled: !(profile.analytics?.enabled ?? false),
                          },
                        })
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        profile.analytics?.enabled ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                      aria-pressed={!!profile.analytics?.enabled}
                      aria-label="Toggle analytics"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          profile.analytics?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Supabase Project URL</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium text-gray-700"
                      value={profile.analytics?.supabaseUrl || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          analytics: {
                            ...(profile.analytics ?? {}),
                            supabaseUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://xxxx.supabase.co"
                    />
                    <p className="text-[11px] text-gray-400 mt-2">
                      Requires Edge Functions <code>openbento-analytics-track</code> and <code>openbento-analytics-admin</code>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Site ID</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{activeBentoId || '—'}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Admin token (dashboard)</p>
                      <input
                        type="password"
                        value={analyticsAdminToken}
                        onChange={(e) => setAnalyticsAdminToken(e.target.value)}
                        placeholder="OPENBENTO_ANALYTICS_ADMIN_TOKEN"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all font-medium text-gray-700"
                      />
                      <p className="text-[11px] text-gray-400 mt-2">Stored in session only.</p>
                    </div>
                  </div>

                  {analyticsSupabaseUrl && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Track endpoint</p>
                        <p className="text-xs font-mono text-gray-700 break-all">{analyticsTrackEndpoint}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin endpoint</p>
                        <p className="text-xs font-mono text-gray-700 break-all">{analyticsAdminEndpoint}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Deploy defaults */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deploy</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default deployment target</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={deployTarget}
                      onChange={(e) => setDeployTarget(e.target.value as ExportDeploymentTarget)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800"
                    >
                      <option value="vercel">Vercel</option>
                      <option value="netlify">Netlify</option>
                      <option value="docker">Docker (nginx)</option>
                      <option value="vps">VPS (nginx)</option>
                      <option value="heroku">Heroku</option>
                      <option value="github-pages">GitHub Pages</option>
                    </select>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <Download size={14} />
                      Used by export
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 pt-6 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>

          <ImageCropModal
            isOpen={!!pendingAvatarSrc}
            src={pendingAvatarSrc || ''}
            title="Crop profile photo"
            onCancel={() => setPendingAvatarSrc(null)}
            onConfirm={(dataUrl) => {
              setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
              setPendingAvatarSrc(null);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
