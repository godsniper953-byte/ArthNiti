import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';
import {
  closeTurnstileChallenge,
  getConfiguredTurnstileSiteKey,
  subscribeTurnstileChallenge,
  TurnstileChallengeState,
  verifyTurnstileTokenWithServer,
} from '../../services/securityClient';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'dark' | 'light' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileChallengeModalProps {
  theme: 'dark' | 'light';
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-api-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TurnstileChallengeModal: React.FC<TurnstileChallengeModalProps> = ({
  theme,
}) => {
  const [challengeState, setChallengeState] = useState<TurnstileChallengeState>({
    isOpen: false,
    reason: '',
  });
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = getConfiguredTurnstileSiteKey();

  useEffect(() => {
    return subscribeTurnstileChallenge((nextState) => {
      setChallengeState(nextState);
      if (nextState.isOpen) {
        setErrorMsg(null);
        setVerifiedSuccess(false);
        setVerifying(false);
      }
    });
  }, []);

  // Lazy-load official Cloudflare Turnstile script only when modal opens
  useEffect(() => {
    if (!challengeState.isOpen || !siteKey) return;

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      const handleLoad = () => setScriptLoaded(true);
      existing.addEventListener('load', handleLoad);
      return () => existing.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () =>
      setErrorMsg('Unable to load Cloudflare Turnstile verification widget.');
    document.head.appendChild(script);
  }, [challengeState.isOpen, siteKey]);

  // Render widget when scriptLoaded + container ready
  useEffect(() => {
    if (
      !challengeState.isOpen ||
      !scriptLoaded ||
      !siteKey ||
      !window.turnstile ||
      !widgetContainerRef.current
    ) {
      return;
    }

    widgetContainerRef.current.innerHTML = '';
    try {
      const id = window.turnstile.render(widgetContainerRef.current, {
        sitekey: siteKey,
        theme: theme === 'dark' ? 'dark' : 'light',
        callback: async (token: string) => {
          setVerifying(true);
          setErrorMsg(null);
          const result = await verifyTurnstileTokenWithServer(token);
          setVerifying(false);
          if (result.ok) {
            setVerifiedSuccess(true);
          } else {
            setErrorMsg(
              result.error || 'Verification failed. Please try again.'
            );
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          }
        },
        'expired-callback': () => {
          setErrorMsg(
            'Verification token expired. Please complete the challenge again.'
          );
        },
        'error-callback': () => {
          setErrorMsg(
            'Cloudflare Turnstile encountered a challenge error. Please retry.'
          );
        },
      });
      widgetIdRef.current = id;
    } catch {
      setErrorMsg('Failed to initialize Cloudflare Turnstile widget.');
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [challengeState.isOpen, scriptLoaded, siteKey, theme]);

  if (!challengeState.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="turnstile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
          theme === 'dark'
            ? 'bg-[#0B1325] border-slate-800 text-slate-100'
            : 'bg-white border-[#CBD5E1] text-[#172033]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-emerald-400">
                ARTHNITI SECURITY SHIELD
              </div>
              <h2
                id="turnstile-modal-title"
                className={`text-base font-display font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                }`}
              >
                Human Verification Required
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTurnstileChallenge}
            aria-label="Close security verification dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          {challengeState.reason}
        </p>

        {!siteKey ? (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Turnstile Site Key Not Configured</span>
            </div>
            <p className="text-slate-300">
              Set <span className="font-mono-tabular">NEXT_PUBLIC_TURNSTILE_SITE_KEY</span> (or{' '}
              <span className="font-mono-tabular">VITE_TURNSTILE_SITE_KEY</span>) and{' '}
              <span className="font-mono-tabular">TURNSTILE_SECRET_KEY</span> in your environment variables to enable live Cloudflare Turnstile verification.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[84px] py-2">
            {!scriptLoaded && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading Cloudflare Turnstile…</span>
              </div>
            )}
            <div ref={widgetContainerRef} className="flex justify-center" />
          </div>
        )}

        {verifying && (
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 font-mono-tabular">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying token with ArthNiti Security Shield…</span>
          </div>
        )}

        {verifiedSuccess && (
          <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verification complete. Resuming request…</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Protected by Cloudflare Turnstile</span>
          <button
            type="button"
            onClick={closeTurnstileChallenge}
            className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
