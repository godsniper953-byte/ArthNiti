import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Loader2,
  Lock,
  Moon,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import {
  getConfiguredTurnstileSiteKey,
  verifyTurnstileTokenWithServer,
} from '../../services/securityClient';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-api-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface HumanVerificationGateProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onVerified: () => void;
  isCheckingSession?: boolean;
  siteKeyOverride?: string;
  initialServiceError?: string | null;
  onRetrySessionCheck?: () => void;
}

export const HumanVerificationGate: React.FC<HumanVerificationGateProps> = ({
  theme,
  onToggleTheme,
  onVerified,
  isCheckingSession = false,
  siteKeyOverride,
  initialServiceError = null,
  onRetrySessionCheck,
}) => {
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [scriptLoadFailed, setScriptLoadFailed] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialServiceError);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState<boolean>(
    Boolean(initialServiceError)
  );
  const [renderAttempt, setRenderAttempt] = useState<number>(0);

  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastSubmittedTokenRef = useRef<string | null>(null);
  const verifyingInFlightRef = useRef<boolean>(false);

  // Keep latest callbacks in refs so parent re-renders never destroy an active Turnstile widget
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const siteKey = (siteKeyOverride || getConfiguredTurnstileSiteKey()).trim();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (initialServiceError) {
      setErrorMsg(initialServiceError);
      setServiceUnavailable(true);
    }
  }, [initialServiceError]);

  // Load official Cloudflare Turnstile API script once session check is complete
  useEffect(() => {
    if (isCheckingSession) return;

    if (!siteKey) {
      setServiceUnavailable(true);
      setErrorCode('SECRET_NOT_CONFIGURED');
      setErrorMsg(
        'Cloudflare Turnstile verification is not configured. Access cannot be granted until verification is available.'
      );
      return;
    }

    if (typeof window !== 'undefined' && window.turnstile) {
      setScriptLoaded(true);
      setScriptLoadFailed(false);
      return;
    }

    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const timeoutId = window.setTimeout(() => {
      if (!window.turnstile) {
        setScriptLoadFailed(true);
        setServiceUnavailable(true);
        setErrorCode('UPSTREAM_ERROR');
        setErrorMsg(
          'Cloudflare Turnstile verification service is temporarily unavailable or blocked by a network filter. Please click Retry.'
        );
      }
    }, 10000);

    if (existing) {
      const handleLoad = () => {
        window.clearTimeout(timeoutId);
        setScriptLoaded(true);
        setScriptLoadFailed(false);
      };
      const handleError = () => {
        window.clearTimeout(timeoutId);
        setScriptLoadFailed(true);
        setServiceUnavailable(true);
        setErrorCode('UPSTREAM_ERROR');
        setErrorMsg(
          'Unable to load Cloudflare Turnstile verification widget. Please check your connection and retry.'
        );
      };
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        window.clearTimeout(timeoutId);
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timeoutId);
      setScriptLoaded(true);
      setScriptLoadFailed(false);
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      setScriptLoadFailed(true);
      setServiceUnavailable(true);
      setErrorCode('UPSTREAM_ERROR');
      setErrorMsg(
        'Cloudflare Turnstile verification service is temporarily unavailable. Please retry in a moment.'
      );
    };
    document.head.appendChild(script);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCheckingSession, siteKey, renderAttempt]);

  // Render the Cloudflare Turnstile checkbox widget and verify token server-side
  useEffect(() => {
    if (
      isCheckingSession ||
      !scriptLoaded ||
      !siteKey ||
      typeof window === 'undefined' ||
      !window.turnstile ||
      !widgetContainerRef.current
    ) {
      return;
    }

    widgetContainerRef.current.innerHTML = '';
    lastSubmittedTokenRef.current = null;
    verifyingInFlightRef.current = false;

    try {
      const id = window.turnstile.render(widgetContainerRef.current, {
        sitekey: siteKey,
        theme: isDark ? 'dark' : 'light',
        'refresh-expired': 'auto',
        retry: 'auto',
        callback: async (token: string) => {
          const cleanToken = String(token || '').trim();
          // Prevent duplicate frontend submissions of the same token
          if (
            !cleanToken ||
            verifyingInFlightRef.current ||
            lastSubmittedTokenRef.current === cleanToken
          ) {
            return;
          }

          lastSubmittedTokenRef.current = cleanToken;
          verifyingInFlightRef.current = true;
          setVerifying(true);
          setErrorMsg(null);
          setErrorCode(null);
          setServiceUnavailable(false);

          const result = await verifyTurnstileTokenWithServer(cleanToken);
          verifyingInFlightRef.current = false;
          setVerifying(false);

          if (result.ok) {
            setVerifiedSuccess(true);
            window.setTimeout(() => {
              onVerifiedRef.current();
            }, 260);
          } else {
            lastSubmittedTokenRef.current = null;
            setServiceUnavailable(Boolean(result.serviceUnavailable));
            setErrorCode(result.errorCode || 'VERIFICATION_FAILED');
            setErrorMsg(
              result.error ||
                'Server-side human verification failed. A fresh challenge has been generated — please try again.'
            );
            // Automatically reset widget to generate a fresh single-use token
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.reset(widgetIdRef.current);
              } catch {
                // Ignore reset error
              }
            }
          }
        },
        'expired-callback': () => {
          lastSubmittedTokenRef.current = null;
          verifyingInFlightRef.current = false;
          setVerifying(false);
          setVerifiedSuccess(false);
          setErrorCode('TOKEN_EXPIRED');
          setErrorMsg(
            'Verification token expired. A new challenge has been generated — please check the box again.'
          );
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch {
              // Ignore reset error
            }
          }
        },
        'error-callback': () => {
          lastSubmittedTokenRef.current = null;
          verifyingInFlightRef.current = false;
          setVerifying(false);
          setVerifiedSuccess(false);
          setServiceUnavailable(true);
          setErrorCode('UPSTREAM_ERROR');
          setErrorMsg(
            'Cloudflare Turnstile verification service encountered a temporary error. Please click Retry.'
          );
        },
      });
      widgetIdRef.current = id;
    } catch {
      setServiceUnavailable(true);
      setErrorCode('UPSTREAM_ERROR');
      setErrorMsg(
        'Unable to initialize the Cloudflare Turnstile widget. Please click Retry.'
      );
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
  }, [isCheckingSession, scriptLoaded, siteKey, isDark, renderAttempt]);

  const handleRetryVerification = useCallback(() => {
    setErrorMsg(null);
    setErrorCode(null);
    setServiceUnavailable(false);
    setVerifying(false);
    setVerifiedSuccess(false);
    lastSubmittedTokenRef.current = null;
    verifyingInFlightRef.current = false;

    if (onRetrySessionCheck) {
      onRetrySessionCheck();
    }

    if (scriptLoadFailed) {
      const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      setScriptLoaded(false);
      setScriptLoadFailed(false);
      setRenderAttempt((prev) => prev + 1);
      return;
    }

    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        return;
      } catch {
        // Fall through to full re-render
      }
    }
    setRenderAttempt((prev) => prev + 1);
  }, [onRetrySessionCheck, scriptLoadFailed]);

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        isDark
          ? 'bg-[#060B16] text-[#F8FAFC]'
          : 'bg-[#F8FAFC] text-[#172033]'
      }`}
    >
      {/* Top Minimal Brand & Theme Bar */}
      <header
        className={`w-full border-b px-4 sm:px-8 py-3.5 flex items-center justify-between ${
          isDark
            ? 'bg-[#091224]/90 border-slate-800/80'
            : 'bg-white/95 border-[#CBD5E1]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-bold tracking-tight text-sm ${
                  isDark ? 'text-white' : 'text-[#0F172A]'
                }`}
              >
                ARTHNITI
              </span>
              <span className="text-[10px] font-mono-tabular uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                INDIA MACRO INTELLIGENCE
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
            isDark
              ? 'border-slate-800 bg-[#0D162B] text-slate-300 hover:border-slate-700 hover:text-white'
              : 'border-[#CBD5E1] bg-slate-50 text-[#172033] hover:bg-slate-100'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span>Dark</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all ${
            isDark
              ? 'bg-[#0B1325] border-slate-800/90 shadow-black/60'
              : 'bg-white border-[#CBD5E1] shadow-slate-200/80'
          }`}
        >
          {/* Subtle Security Shield Icon + Brand Kicker */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-emerald-400 font-semibold">
                ARTHNITI SECURITY GATEWAY
              </div>
              <h1
                className={`text-xl sm:text-2xl font-display font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#0F172A]'
                }`}
              >
                Verify You&apos;re Human
              </h1>
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto ${
                  isDark ? 'text-slate-400' : 'text-[#475569]'
                }`}
              >
                Please complete the security check below to access ArthNiti&apos;s live Indian macroeconomic intelligence and market feeds.
              </p>
            </div>
          </div>

          {/* Familiar "I'm not a robot" Cloudflare Turnstile Checkbox Container */}
          <div
            className={`mt-6 rounded-xl border p-4 space-y-3 ${
              isDark
                ? 'bg-[#060B16]/90 border-slate-800/90'
                : 'bg-[#F8FAFC] border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-slate-200' : 'text-[#172033]'
                  }`}
                >
                  I&apos;m not a robot
                </span>
              </div>
              <span
                className={`text-[10px] font-mono-tabular uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-[#64748B]'
                }`}
              >
                Cloudflare Turnstile
              </span>
            </div>

            <div className="min-h-[76px] flex flex-col items-center justify-center py-1">
              {isCheckingSession ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Validating security session…</span>
                </div>
              ) : (
                <>
                  {!scriptLoaded && !scriptLoadFailed && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading Cloudflare Turnstile verification widget…</span>
                    </div>
                  )}

                  <div
                    ref={widgetContainerRef}
                    data-testid="turnstile-widget-container"
                    className="flex justify-center w-full overflow-x-auto"
                  />
                </>
              )}
            </div>
          </div>

          {/* Server-side Siteverify Progress Indicator */}
          {verifying && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-400 flex items-center justify-center gap-2 font-mono-tabular"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Verifying token with Cloudflare Siteverify…</span>
            </div>
          )}

          {/* Server-side Verification Success State */}
          {verifiedSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-xs text-emerald-400 flex items-center justify-center gap-2 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verification successful. Opening ArthNiti dashboard…</span>
            </div>
          )}

          {/* Verification Failure or Service Unavailable Error State + Retry Button */}
          {errorMsg && (
            <div
              role="alert"
              className={`mt-4 p-3.5 rounded-xl border text-xs space-y-3 ${
                serviceUnavailable
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {serviceUnavailable ? (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="space-y-1">
                  <div
                    className={`font-semibold ${
                      isDark
                        ? serviceUnavailable
                          ? 'text-amber-300'
                          : 'text-rose-300'
                        : 'text-[#0F172A]'
                    }`}
                  >
                    {errorCode === 'SECRET_NOT_CONFIGURED'
                      ? 'Server Configuration Error'
                      : errorCode === 'TOKEN_EXPIRED'
                      ? 'Verification Challenge Expired'
                      : errorCode === 'TOKEN_ALREADY_USED'
                      ? 'Duplicate Verification Token'
                      : serviceUnavailable
                      ? 'Verification Service Temporarily Unavailable'
                      : 'Human Verification Failed'}
                  </div>
                  <p
                    className={
                      isDark ? 'text-slate-300 leading-relaxed' : 'text-[#172033] leading-relaxed'
                    }
                  >
                    {errorMsg}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRetryVerification}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Verification</span>
              </button>
            </div>
          )}

          {/* Footer Security Provenance Note */}
          <div
            className={`mt-6 pt-4 border-t text-[11px] flex items-center justify-between gap-2 ${
              isDark
                ? 'border-slate-800/80 text-slate-400'
                : 'border-[#CBD5E1] text-[#64748B]'
            }`}
          >
            <span>Server-Validated Siteverify Protection</span>
            <span className="font-mono-tabular">Session TTL: 60m</span>
          </div>
        </div>
      </main>

      {/* Minimal Bottom Attribution */}
      <footer
        className={`px-4 py-3 text-center text-[11px] border-t ${
          isDark
            ? 'border-slate-800/60 text-slate-400'
            : 'border-[#CBD5E1] text-[#64748B]'
        }`}
      >
        <span>
          ArthNiti · Indian Economic Intelligence Platform · Protected by Cloudflare Turnstile
        </span>
      </footer>
    </div>
  );
};
