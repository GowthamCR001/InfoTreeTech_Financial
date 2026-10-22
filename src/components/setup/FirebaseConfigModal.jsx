import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  isFirebaseConfigured, 
  firebaseConfig, 
  saveFirebaseConfigDirectly, 
  resetFirebaseConfig 
} from '../../services/firebase';

export function FirebaseConfigModal({ isOpen, onClose }) {
  const isConfigured = isFirebaseConfigured();
  const [pastedSnippet, setPastedSnippet] = useState('');
  const [parseError, setParseError] = useState(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const envSample = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=infotreetech-financial.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=infotreetech-financial
VITE_FIREBASE_STORAGE_BUCKET=infotreetech-financial.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  /**
   * Intelligently parses Firebase Config from either:
   * 1. JavaScript snippet (const firebaseConfig = { ... })
   * 2. Pure JSON object ({ "apiKey": ... })
   * 3. .env format (VITE_FIREBASE_API_KEY=...)
   */
  const handleConnectPastedConfig = () => {
    setParseError(null);
    if (!pastedSnippet.trim()) {
      setParseError('Please paste your Firebase configuration snippet first.');
      return;
    }

    try {
      let config = {};

      // Case 1: .env style format
      if (pastedSnippet.includes('VITE_FIREBASE_')) {
        const lines = pastedSnippet.split('\n');
        lines.forEach(line => {
          const match = line.match(/^VITE_FIREBASE_([A-Z_]+)\s*=\s*['"]?([^'"]+)['"]?/);
          if (match) {
            const key = match[1];
            const val = match[2].trim();
            if (key === 'API_KEY') config.apiKey = val;
            if (key === 'AUTH_DOMAIN') config.authDomain = val;
            if (key === 'PROJECT_ID') config.projectId = val;
            if (key === 'STORAGE_BUCKET') config.storageBucket = val;
            if (key === 'MESSAGING_SENDER_ID') config.messagingSenderId = val;
            if (key === 'APP_ID') config.appId = val;
          }
        });
      } else {
        // Case 2: JavaScript object or JSON snippet
        const extractField = (fieldName) => {
          const regex = new RegExp(`['"]?${fieldName}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
          const m = pastedSnippet.match(regex);
          return m ? m[1].trim() : null;
        };

        config = {
          apiKey: extractField('apiKey'),
          authDomain: extractField('authDomain'),
          projectId: extractField('projectId'),
          storageBucket: extractField('storageBucket'),
          messagingSenderId: extractField('messagingSenderId'),
          appId: extractField('appId'),
        };
      }

      if (!config.apiKey || !config.projectId) {
        throw new Error('Could not find valid apiKey and projectId in the snippet. Please verify the copied snippet.');
      }

      saveFirebaseConfigDirectly(config);
    } catch (err) {
      setParseError(err.message || 'Failed to parse configuration snippet. Please check formatting.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${isConfigured ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Connect Real-Time Firebase Project</h3>
              <p className="text-xs text-slate-300 truncate">
                Direct client-side Firebase Auth & Cloud Firestore connectivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 flex-1 overflow-y-auto touch-scroll leading-relaxed">
          {/* Status banner */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            isConfigured 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-start gap-2.5">
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {isConfigured ? 'Connected to Live Firebase Database' : 'Running in Interactive Preview Mode (Demo Data)'}
                </h4>
                <p className="mt-1 opacity-90">
                  {isConfigured
                    ? `Active Project: "${firebaseConfig.projectId}". Real-time reading and saving directly with Google Cloud Firestore.`
                    : 'Currently showing temporary preview records. Connect your InfoTreeTech-Financial Firebase project below to start saving real data.'}
                </p>
              </div>
            </div>

            {isConfigured && (
              <button
                onClick={resetFirebaseConfig}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-lg transition-colors flex-shrink-0"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Quick Paste & Connect Box */}
          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Connect: Paste Firebase SDK Snippet
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                Instant Real-Time Connection
              </span>
            </div>

            <p className="text-slate-600 text-xs">
              In Firebase Console, go to <strong>Project settings (Gear Icon) &gt; General &gt; Your apps &gt; Web app</strong> and paste the <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono text-indigo-950">firebaseConfig</code> code snippet below:
            </p>

            <textarea
              rows="4"
              value={pastedSnippet}
              onChange={(e) => setPastedSnippet(e.target.value)}
              placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "infotreetech-financial.firebaseapp.com",
  projectId: "infotreetech-financial",
  storageBucket: "infotreetech-financial.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};`}
              className="w-full p-2.5 rounded-lg border border-indigo-300 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {parseError && (
              <p className="text-xs text-rose-600 font-semibold">{parseError}</p>
            )}

            <button
              onClick={handleConnectPastedConfig}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Save & Connect Live Database</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternative: .env Configuration */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-xs">
                Alternative: Update your local <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">.env</code> file
              </h4>
              <button
                onClick={() => copyToClipboard(envSample)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
              {envSample}
            </pre>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex justify-end pb-safe">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
