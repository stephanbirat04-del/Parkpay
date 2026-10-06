import { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { VehicleRecord, LotSettings } from '../types';
import {
  signInWithGoogle,
  sendGmailMessage,
  generateParkingReceiptHtml,
  getAccessToken,
  signOutGoogle,
} from '../services/gmail';
import { auth } from '../firebase';

interface GmailEmailModalProps {
  vehicle: VehicleRecord | null;
  lotSettings: LotSettings;
  isOpen: boolean;
  onClose: () => void;
  senderName: string;
}

export function GmailEmailModal({
  vehicle,
  lotSettings,
  isOpen,
  onClose,
  senderName,
}: GmailEmailModalProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);

  // Initialize fields when opened
  useEffect(() => {
    if (isOpen && vehicle) {
      setRecipient('');
      setSubject(`Parking Receipt: ${vehicle.plateNumber} · ${lotSettings.lotName}`);
      setStatusMessage(null);
      setShowConfirmStep(false);
    }
  }, [isOpen, vehicle, lotSettings.lotName]);

  // Check auth status
  useEffect(() => {
    const checkToken = async () => {
      const token = await getAccessToken();
      if (token && auth.currentUser) {
        setGoogleUserEmail(auth.currentUser.email);
      } else {
        setGoogleUserEmail(null);
      }
    };
    checkToken();
  }, [isOpen, isSigningIn]);

  if (!isOpen || !vehicle) return null;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const { user } = await signInWithGoogle();
      setGoogleUserEmail(user.email);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to authenticate with Google. Please try again.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }
    setStatusMessage(null);
    setShowConfirmStep(true);
  };

  // Execution after explicit user confirmation
  const handleConfirmedSend = async () => {
    setIsSending(true);
    setStatusMessage(null);

    try {
      const htmlBody = generateParkingReceiptHtml(vehicle, lotSettings, senderName);
      await sendGmailMessage(recipient.trim(), subject.trim(), htmlBody);

      setStatusMessage({
        type: 'success',
        text: `Receipt successfully sent via Gmail to ${recipient.trim()}`,
      });
      setShowConfirmStep(false);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch email. Please re-authenticate your Google account.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-[#FAFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Email Digital Receipt</h2>
              <p className="text-xs text-neutral-500">Send receipt via your connected Gmail account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* Google Account Connection Status */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/90 text-xs">
            {googleUserEmail ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <span className="text-neutral-500">Sending as: </span>
                    <strong className="text-neutral-900 font-medium">{googleUserEmail}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOutGoogle();
                    setGoogleUserEmail(null);
                  }}
                  className="text-[11px] text-neutral-500 hover:text-red-600 underline cursor-pointer"
                >
                  Change Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-700">
                  <ShieldCheck className="w-4 h-4 text-neutral-500" />
                  <span>Connect your Google account to send receipts directly from Gmail:</span>
                </div>

                {/* Google Sign In Button per design guidelines */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs font-semibold text-xs text-neutral-800 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Vehicle Snapshot Card */}
          <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-neutral-500">Plate Number:</span>
              <div className="font-bold text-neutral-900 text-sm mt-0.5">{vehicle.plateNumber}</div>
            </div>
            <div>
              <span className="text-neutral-500">Receipt Fee:</span>
              <div className="font-bold text-emerald-800 text-sm mt-0.5">₹{vehicle.fee}</div>
            </div>
            <div>
              <span className="text-neutral-500">Receipt ID:</span>
              <div className="font-mono text-neutral-700 mt-0.5">{vehicle.receiptNumber || 'PP-PENDING'}</div>
            </div>
            <div>
              <span className="text-neutral-500">Duration:</span>
              <div className="text-neutral-700 mt-0.5">{vehicle.durationMinutes || 0} mins</div>
            </div>
          </div>

          {/* Mandatory Confirmation Step Modal per Skill Instructions */}
          {showConfirmStep ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">Confirm Sending Email via Gmail</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You are about to send an authentic parking receipt email from{' '}
                    <strong>{googleUserEmail}</strong> to <strong>{recipient.trim()}</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmStep(false)}
                  disabled={isSending}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedSend}
                  disabled={isSending}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpenConfirm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Customer Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="driver@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!googleUserEmail}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                    googleUserEmail
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Send Receipt</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
