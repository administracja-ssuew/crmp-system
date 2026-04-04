// api/_email.js
// Shared email utilities for all Resend transactional email handlers.
// Imported by: approve-request.js, reject-request.js, request-access.js

/**
 * Verified sender address.
 * Set RESEND_FROM_EMAIL in Vercel environment variables to a domain that has
 * been verified in the Resend dashboard. Falls back to 'noreply@example.com'
 * so that a missing env var causes Resend to reject loudly (logged error)
 * rather than silently sending from the sandbox address.
 */
export const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Escapes user-supplied strings for safe HTML interpolation.
 * Prevents HTML injection when name/email from req.body is embedded in
 * the email body template literal.
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wraps a content block in the standard SSUEW email shell.
 * Uses table-based layout for Outlook compatibility.
 * All styles are inline — Gmail strips <style> blocks.
 * @param {string} title    — Shown in the header and inbox preview
 * @param {string} bodyHtml — Inner HTML for the email body
 * @returns {string}        — Complete HTML document string
 */
export function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">
              Samorząd Studentów UEW
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:16px 32px;text-align:center;">
            <span style="color:#94a3b8;font-size:12px;">
              Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu &bull; cra-system.vercel.app
            </span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a CTA button as an inline-styled <a> tag.
 * @param {string} label — Button text
 * @param {string} href  — Destination URL
 * @returns {string}
 */
export function ctaButton(label, href) {
  return `<a href="${href}"
   style="display:inline-block;background:#4f46e5;color:#ffffff;
          padding:12px 24px;border-radius:8px;text-decoration:none;
          font-weight:bold;font-size:16px;margin-top:24px;">
  ${label}
</a>`;
}
