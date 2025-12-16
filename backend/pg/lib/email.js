/**
 * Email service using Resend (free tier: 100 emails/day)
 * Set RESEND_API_KEY in environment to enable
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'CopyBot <noreply@copybot.app>';

async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    console.log('[Email] Skipped (no RESEND_API_KEY):', { to, subject });
    return { success: false, reason: 'not_configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Failed:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('[Email] Sent:', { to, subject, id: data.id });
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Email] Error:', err);
    return { success: false, error: err.message };
  }
}

// Email templates
async function sendActivationEmail(subscriber, host) {
  return sendEmail({
    to: subscriber.email,
    subject: `Welcome to ${host.name} - Your CopyBot Access`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to ${host.name}!</h1>
        <p>Your subscription has been activated successfully.</p>
        
        <div style="background: #1f2937; color: #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Your API Key:</p>
          <code style="font-size: 14px; word-break: break-all;">${subscriber.api_key}</code>
        </div>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Copy your API key above</li>
          <li>Open NinjaTrader and go to CopyBot settings</li>
          <li>Paste your API key and save</li>
          <li>Trades will now sync automatically!</li>
        </ol>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://copybot-dashboard.onrender.com'}/subscriber/login" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Access Subscriber Portal
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
          Configure your trading preferences, view history, and more in the subscriber portal.
        </p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://copybot-dashboard.onrender.com'}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Reset Your CopyBot Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Password Reset Request</h1>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
          Link not working? Copy and paste this URL: ${resetUrl}
        </p>
      </div>
    `
  });
}

async function sendDailySummaryEmail(subscriber, stats) {
  return sendEmail({
    to: subscriber.email,
    subject: `Daily Trade Summary - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Daily Trade Summary</h1>
        <p>Here's your trading activity for today:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;"><strong>Signals Received:</strong></td>
              <td style="text-align: right;">${stats.signals_received || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Trades Executed:</strong></td>
              <td style="text-align: right;">${stats.trades_executed || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Wins:</strong></td>
              <td style="text-align: right; color: #10b981;">${stats.wins || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Losses:</strong></td>
              <td style="text-align: right; color: #ef4444;">${stats.losses || 0}</td>
            </tr>
            <tr style="border-top: 1px solid #d1d5db;">
              <td style="padding: 12px 0;"><strong>Daily P&L:</strong></td>
              <td style="text-align: right; font-size: 18px; color: ${stats.pnl >= 0 ? '#10b981' : '#ef4444'};">
                $${(stats.pnl || 0).toFixed(2)}
              </td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          View detailed history in your <a href="${process.env.FRONTEND_URL}/subscriber/trades">subscriber portal</a>.
        </p>
      </div>
    `
  });
}

async function sendSignalAlertEmail(subscriber, signal) {
  const trade = signal.payload || {};
  return sendEmail({
    to: subscriber.email,
    subject: `New Signal: ${trade.side} ${trade.symbol}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">New Trading Signal</h1>
        
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; color: #e5e7eb;">
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Symbol:</td>
              <td style="text-align: right; font-weight: bold;">${trade.symbol}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Side:</td>
              <td style="text-align: right; font-weight: bold; color: ${trade.side === 'BUY' ? '#10b981' : '#ef4444'};">
                ${trade.side}
              </td>
            </tr>
            ${trade.entryPrice ? `
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Entry:</td>
              <td style="text-align: right;">${trade.entryPrice}</td>
            </tr>` : ''}
            ${trade.stopLoss ? `
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Stop Loss:</td>
              <td style="text-align: right; color: #ef4444;">${trade.stopLoss}</td>
            </tr>` : ''}
            ${trade.takeProfits?.[0] ? `
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Take Profit:</td>
              <td style="text-align: right; color: #10b981;">${trade.takeProfits[0].price}</td>
            </tr>` : ''}
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          Signal received at ${new Date().toLocaleString()}
        </p>
      </div>
    `
  });
}

async function sendRiskAlertEmail(subscriber, alertType, details) {
  const titles = {
    daily_loss: 'Daily Loss Limit Reached',
    daily_profit: 'Daily Profit Target Reached',
    trade_limit: 'Daily Trade Limit Reached'
  };
  
  return sendEmail({
    to: subscriber.email,
    subject: `⚠️ Risk Alert: ${titles[alertType] || 'Trading Alert'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">⚠️ Risk Alert</h1>
        <h2 style="color: #e5e7eb;">${titles[alertType] || 'Trading Alert'}</h2>
        
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin: 20px 0; color: #e5e7eb;">
          <p>${details.message || 'A risk limit has been triggered.'}</p>
          ${details.current ? `<p>Current: ${details.current}</p>` : ''}
          ${details.limit ? `<p>Limit: ${details.limit}</p>` : ''}
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Trading has been ${details.stopped ? 'paused' : 'limited'} based on your preferences.
          You can adjust your settings in the subscriber portal.
        </p>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'https://copybot-dashboard.onrender.com'}/subscriber/settings" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Adjust Settings
          </a>
        </p>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendActivationEmail,
  sendPasswordResetEmail,
  sendDailySummaryEmail,
  sendSignalAlertEmail,
  sendRiskAlertEmail
};
