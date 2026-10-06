import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { VehicleRecord, LotSettings } from '../types';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

// In-memory caching for the access token (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Initialize Firebase Auth listener for Google Workspace session
 */
export function initGoogleAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
}

/**
 * Sign in with Google using popup and obtain access token with Gmail scopes
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get the current cached access token
 */
export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Check if the user has an active Gmail-authorized session
 */
export function isGmailAuthorized(): boolean {
  return Boolean(cachedAccessToken && auth.currentUser);
}

/**
 * Sign out of Google
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

/**
 * Fetch the authenticated user's Gmail profile
 */
export async function getGmailProfile(): Promise<{ emailAddress: string; messagesTotal: number } | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Gmail API error: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Helper to encode email into RFC 2822 URL-safe base64 string
 */
function createRawEmail(to: string, from: string, subject: string, bodyHtml: string): string {
  const emailLines = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyHtml,
  ];

  const raw = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send a message using Gmail API (Requires explicit confirmation before calling)
 */
export async function sendGmailMessage(
  recipientEmail: string,
  subject: string,
  bodyHtml: string
): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Gmail. Please sign in with Google.');
  }

  const senderEmail = auth.currentUser?.email || 'me';
  const rawBase64 = createRawEmail(recipientEmail, senderEmail, subject, bodyHtml);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawBase64 }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to send email (${res.status})`);
  }

  return res.json();
}

/**
 * Generate formatted HTML template for a parking receipt
 */
export function generateParkingReceiptHtml(
  vehicle: VehicleRecord,
  lotSettings: LotSettings,
  senderName: string
): string {
  const lot = lotSettings.lotName;
  const hours = Math.floor((vehicle.durationMinutes || 0) / 60);
  const mins = (vehicle.durationMinutes || 0) % 60;
  const durationStr = `${hours > 0 ? `${hours}h ` : ''}${mins}m`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>ParkPay Official Receipt</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f3; margin: 0; padding: 24px; color: #1f2937;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background-color: #047857; color: #ffffff; padding: 20px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ParkPay · Gate Receipt</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">${lot}</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">License Plate</div>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #111827; margin: 4px 0;">${vehicle.plateNumber}</div>
          <div style="font-size: 12px; color: #047857; font-weight: 600;">${vehicle.vehicleType} · ${vehicle.status === 'Exited' ? 'PAID & EXITED' : 'ACTIVE'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Receipt No.</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-family: monospace;">${vehicle.receiptNumber || 'PP-PENDING'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Entry Time</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${new Date(vehicle.entryTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
          ${
            vehicle.exitTime
              ? `<tr>
            <td style="padding: 6px 0; color: #6b7280;">Exit Time</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${new Date(vehicle.exitTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Duration</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${durationStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Payment Method</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${vehicle.paymentMethod || 'Cash'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Cashier / Gate</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${vehicle.loggedBy || senderName}</td>
          </tr>
        </table>

        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border: 1px solid #f3f4f6;">
          <span style="font-size: 14px; font-weight: 600; color: #374151;">Total Amount</span>
          <span style="font-size: 22px; font-weight: 800; color: #047857; text-align: right;">₹${vehicle.fee}</span>
        </div>

        <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
          GSTIN: 17AAACP2026P1Z8 · Municipal Parking Bylaws Apply<br/>
          Thank you for parking with ParkPay. Keep this receipt for your records.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}
