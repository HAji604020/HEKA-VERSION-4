import {
  CustomerInquiry,
  NotificationChannel,
  ChannelNotificationRecord,
  QuotationNotificationMap,
  QuotationNotificationDestinations,
  NotificationProviderStatusSummary
} from '../types';

export const DEFAULT_HEKA_NOTIFICATION_DESTINATIONS: QuotationNotificationDestinations = {
  email: 'khanedriss5951@gmail.com',
  whatsappRaw: '0093728224060',
  whatsappNormalized: '+93728224060',
  telegramPublicLink: 'https://t.me/HEKA_480',
  telegramChatId: '',
  enabledChannels: {
    email: true,
    telegram: true,
    whatsapp: true
  }
};

/**
 * Normalizes international phone numbers:
 * Converts leading "00" (e.g., "0093728224060") to E.164 "+93728224060".
 */
export function normalizeInternationalPhone(rawPhone: string): {
  e164: string;
  digitsOnly: string;
} {
  const cleaned = String(rawPhone || '').replace(/[\s\-().]/g, '');
  if (!cleaned) {
    return { e164: '+93728224060', digitsOnly: '93728224060' };
  }
  let normalized = cleaned;
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  const digitsOnly = normalized.replace(/[^0-9]/g, '');
  return {
    e164: `+${digitsOnly}`,
    digitsOnly
  };
}

/**
 * Redacts any potential token or secret from error strings before saving or returning.
 */
function sanitizeProviderError(rawError: unknown): string {
  const msg = rawError instanceof Error ? rawError.message : String(rawError || 'Unknown provider error');
  return msg
    .replace(/bot[0-9]+:[A-Za-z0-9_-]+/g, 'bot[REDACTED_TOKEN]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]')
    .slice(0, 350);
}

/**
 * Formats a concise, privacy-conscious quotation notification payload containing only necessary trade details.
 */
function formatQuotationSummaryText(inquiry: CustomerInquiry): string {
  const ref = inquiry.requestReference || inquiry.id;
  const productLine = inquiry.productName
    ? `${inquiry.productName} (ID: ${inquiry.productId || 'N/A'})`
    : 'General Commercial Inquiry';
  const qty = inquiry.requestedQuantity || 1;
  const location = inquiry.customerLocation || 'Not specified';

  return [
    `[HEKA LTD – New Quotation Request]`,
    `Reference ID: ${ref}`,
    `Timestamp (UTC): ${inquiry.createdAt}`,
    `Product: ${productLine}`,
    `Requested Quantity: ${qty}`,
    `Customer / Buyer: ${inquiry.customerName}`,
    `Contact: ${inquiry.customerContact}`,
    inquiry.customerEmail ? `Email: ${inquiry.customerEmail}` : null,
    `Location: ${location}`,
    `Message: ${inquiry.message.slice(0, 500)}`
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Inspects server-side environment variables to report honest configuration readiness
 * without ever exposing secret values.
 */
export function getNotificationProviderStatus(
  customDestinations?: Partial<QuotationNotificationDestinations>
): NotificationProviderStatusSummary {
  const rawWhatsapp = customDestinations?.whatsappRaw || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.whatsappRaw;
  const normalizedPhone = normalizeInternationalPhone(rawWhatsapp);

  const destinations: QuotationNotificationDestinations = {
    email: customDestinations?.email || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.email,
    whatsappRaw: rawWhatsapp,
    whatsappNormalized: normalizedPhone.e164,
    telegramPublicLink:
      customDestinations?.telegramPublicLink || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.telegramPublicLink,
    telegramChatId: customDestinations?.telegramChatId || process.env.TELEGRAM_CHAT_ID || '',
    enabledChannels: {
      email: customDestinations?.enabledChannels?.email ?? true,
      telegram: customDestinations?.enabledChannels?.telegram ?? true,
      whatsapp: customDestinations?.enabledChannels?.whatsapp ?? true
    }
  };

  // 1. Email Provider Inspection
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
  const hasEmailWebhook = Boolean(process.env.EMAIL_WEBHOOK_URL);
  const emailConfigured = hasResend || hasSendGrid || hasEmailWebhook;
  const emailProviderName = hasResend
    ? 'Resend Transactional Email API'
    : hasSendGrid
    ? 'Twilio SendGrid Mail API'
    : hasEmailWebhook
    ? 'Configured Transactional Email Webhook'
    : 'Not Configured (Awaiting Server Email Provider)';

  const emailMissingVars = emailConfigured
    ? []
    : ['RESEND_API_KEY (or SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)'];

  // 2. Telegram Provider Inspection
  const hasTelegramToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const resolvedTelegramChatId = (process.env.TELEGRAM_CHAT_ID || destinations.telegramChatId || '').trim();
  // Explicitly reject using a raw t.me URL or unverified @HEKA_480 profile handle as a valid chat_id unless configured
  const hasValidTelegramChatId =
    Boolean(resolvedTelegramChatId) &&
    !resolvedTelegramChatId.startsWith('http://') &&
    !resolvedTelegramChatId.startsWith('https://');
  const telegramConfigured = hasTelegramToken && hasValidTelegramChatId;

  const telegramMissingVars: string[] = [];
  if (!hasTelegramToken) telegramMissingVars.push('TELEGRAM_BOT_TOKEN');
  if (!hasValidTelegramChatId) telegramMissingVars.push('TELEGRAM_CHAT_ID');

  // 3. WhatsApp Business Cloud API Inspection
  const hasWhatsappToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const hasWhatsappPhoneId = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const whatsappConfigured = hasWhatsappToken && hasWhatsappPhoneId;

  const whatsappMissingVars: string[] = [];
  if (!hasWhatsappToken) whatsappMissingVars.push('WHATSAPP_ACCESS_TOKEN');
  if (!hasWhatsappPhoneId) whatsappMissingVars.push('WHATSAPP_PHONE_NUMBER_ID');

  return {
    destinations,
    channels: {
      email: {
        configured: emailConfigured,
        providerName: emailProviderName,
        destination: destinations.email,
        missingEnvVars: emailMissingVars,
        setupInstructions: [
          `Destination email is configured as ${destinations.email}.`,
          'Provision a transactional email API key from Resend (https://resend.com) or SendGrid.',
          'Set RESEND_API_KEY (and optional EMAIL_FROM_ADDRESS) or SENDGRID_API_KEY + SENDGRID_FROM_EMAIL in server-side environment variables.',
          'Never place email API keys or SMTP passwords in client-side code.'
        ]
      },
      telegram: {
        configured: telegramConfigured,
        providerName: telegramConfigured ? 'Telegram Bot API (Official)' : 'Not Configured (Awaiting Bot Token & Chat ID)',
        publicReference: destinations.telegramPublicLink,
        chatIdConfigured: hasValidTelegramChatId,
        missingEnvVars: telegramMissingVars,
        setupInstructions: [
          `Public destination reference is recorded as ${destinations.telegramPublicLink}.`,
          'Create an official Telegram bot via @BotFather on Telegram and copy the HTTP API token into the server-side TELEGRAM_BOT_TOKEN environment variable.',
          'Important: The public profile URL (https://t.me/HEKA_480) is not a valid Bot API chat_id for direct messages.',
          'Have the recipient open the bot in Telegram and send /start (or add the bot as an administrator with "Post Messages" permission to the target channel/group).',
          'Query getUpdates on the Bot API to obtain the numeric chat_id (e.g., 123456789 or -1001234567890) and set it in TELEGRAM_CHAT_ID.'
        ]
      },
      whatsapp: {
        configured: whatsappConfigured,
        providerName: whatsappConfigured
          ? 'Meta WhatsApp Business Cloud API'
          : 'Not Configured (Awaiting WhatsApp Business Platform API)',
        destinationRaw: destinations.whatsappRaw,
        destinationNormalized: destinations.whatsappNormalized,
        missingEnvVars: whatsappMissingVars,
        setupInstructions: [
          `Destination number ${destinations.whatsappRaw} is normalized to E.164 format (${destinations.whatsappNormalized}).`,
          'Create or configure a Meta WhatsApp Business Platform account in the Meta App Dashboard.',
          'Obtain a permanent System User Access Token (WHATSAPP_ACCESS_TOKEN) and the sender Phone Number ID (WHATSAPP_PHONE_NUMBER_ID).',
          'Create and approve a utility/notification message template (optional WHATSAPP_TEMPLATE_NAME) for business-initiated notifications outside the 24-hour customer service window.',
          'Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in server-side environment variables.'
        ]
      }
    }
  };
}

/**
 * Creates the initial 'pending' notification state map before provider dispatch runs.
 */
export function createInitialNotificationMap(
  inquiryId: string,
  customDestinations?: Partial<QuotationNotificationDestinations>
): QuotationNotificationMap {
  const statusSummary = getNotificationProviderStatus(customDestinations);
  const { destinations } = statusSummary;

  return {
    email: {
      channel: 'email',
      status: 'pending',
      destination: destinations.email,
      normalizedDestination: destinations.email.trim().toLowerCase(),
      provider: statusSummary.channels.email.providerName,
      providerNote: 'Pending dispatch to email provider after database persistence.',
      attempts: 0,
      idempotencyKey: `${inquiryId}:email`
    },
    telegram: {
      channel: 'telegram',
      status: 'pending',
      destination: destinations.telegramPublicLink,
      normalizedDestination: destinations.telegramChatId
        ? `chat_id:${destinations.telegramChatId}`
        : destinations.telegramPublicLink,
      provider: statusSummary.channels.telegram.providerName,
      providerNote: 'Pending dispatch to Telegram Bot API after database persistence.',
      attempts: 0,
      idempotencyKey: `${inquiryId}:telegram`
    },
    whatsapp: {
      channel: 'whatsapp',
      status: 'pending',
      destination: destinations.whatsappRaw,
      normalizedDestination: destinations.whatsappNormalized,
      provider: statusSummary.channels.whatsapp.providerName,
      providerNote: 'Pending dispatch to WhatsApp Business Cloud API after database persistence.',
      attempts: 0,
      idempotencyKey: `${inquiryId}:whatsapp`
    }
  };
}

/**
 * Dispatches Email notification via Resend, SendGrid, or configured webhook.
 * Only reports 'sent_accepted' if a real provider returns HTTP 2xx confirmation.
 */
async function dispatchEmailChannel(
  inquiry: CustomerInquiry,
  record: ChannelNotificationRecord,
  destinations: QuotationNotificationDestinations
): Promise<ChannelNotificationRecord> {
  const now = new Date().toISOString();
  const targetEmail = (destinations.email || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.email).trim();
  const summaryText = formatQuotationSummaryText(inquiry);
  const subject = `[HEKA LTD RFQ] ${inquiry.requestReference || inquiry.id} – ${inquiry.productName || 'Quotation Request'}`;

  if (!destinations.enabledChannels.email) {
    return {
      ...record,
      status: 'not_configured',
      destination: targetEmail,
      normalizedDestination: targetEmail.toLowerCase(),
      providerNote: 'Channel disabled by administrator in notification settings.',
      lastAttemptAt: now
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;

  if (!resendKey && !sendgridKey && !webhookUrl) {
    return {
      ...record,
      status: 'not_configured',
      destination: targetEmail,
      normalizedDestination: targetEmail.toLowerCase(),
      provider: 'Unconfigured Email Provider',
      providerNote: `Not Configured: Destination ${targetEmail} is saved, but no server-side email provider credentials (RESEND_API_KEY, SENDGRID_API_KEY, or EMAIL_WEBHOOK_URL) are set in environment variables.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }

  try {
    if (resendKey) {
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'HEKA LTD Notifications <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `${record.idempotencyKey}:${record.attempts + 1}`
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [targetEmail],
          subject,
          text: summaryText
        })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ...record,
          status: 'failed',
          destination: targetEmail,
          normalizedDestination: targetEmail.toLowerCase(),
          provider: 'Resend Transactional Email API',
          providerNote: `Provider Rejected (HTTP ${res.status}): ${sanitizeProviderError(body?.message || body?.error || res.statusText)}`,
          attempts: record.attempts + 1,
          lastAttemptAt: now
        };
      }

      return {
        ...record,
        status: 'sent_accepted',
        destination: targetEmail,
        normalizedDestination: targetEmail.toLowerCase(),
        provider: 'Resend Transactional Email API',
        providerMessageId: body?.id || undefined,
        providerNote: `Provider Accepted: Queued by Resend for ${targetEmail}${body?.id ? ` (ID: ${body.id})` : ''}. Final inbox delivery is handled asynchronously by recipient mail server.`,
        attempts: record.attempts + 1,
        lastAttemptAt: now,
        acceptedAt: now
      };
    }

    if (sendgridKey) {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@hekaltd.com';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: targetEmail }] }],
          from: { email: fromEmail, name: 'HEKA LTD Trade Desk' },
          subject,
          content: [{ type: 'text/plain', value: summaryText }]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        return {
          ...record,
          status: 'failed',
          destination: targetEmail,
          normalizedDestination: targetEmail.toLowerCase(),
          provider: 'Twilio SendGrid Mail API',
          providerNote: `Provider Rejected (HTTP ${res.status}): ${sanitizeProviderError(errText)}`,
          attempts: record.attempts + 1,
          lastAttemptAt: now
        };
      }

      const msgId = res.headers.get('x-message-id') || undefined;
      return {
        ...record,
        status: 'sent_accepted',
        destination: targetEmail,
        normalizedDestination: targetEmail.toLowerCase(),
        provider: 'Twilio SendGrid Mail API',
        providerMessageId: msgId,
        providerNote: `Provider Accepted: SendGrid accepted message for ${targetEmail}${msgId ? ` (X-Message-Id: ${msgId})` : ''}.`,
        attempts: record.attempts + 1,
        lastAttemptAt: now,
        acceptedAt: now
      };
    }

    // Fallback to configured EMAIL_WEBHOOK_URL
    const res = await fetch(webhookUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMAIL_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_SECRET}` }
          : {})
      },
      body: JSON.stringify({
        to: targetEmail,
        subject,
        text: summaryText,
        inquiryId: inquiry.id,
        requestReference: inquiry.requestReference
      })
    });

    if (!res.ok) {
      return {
        ...record,
        status: 'failed',
        destination: targetEmail,
        normalizedDestination: targetEmail.toLowerCase(),
        provider: 'Configured Email Webhook',
        providerNote: `Webhook Failed (HTTP ${res.status}): ${sanitizeProviderError(res.statusText)}`,
        attempts: record.attempts + 1,
        lastAttemptAt: now
      };
    }

    return {
      ...record,
      status: 'sent_accepted',
      destination: targetEmail,
      normalizedDestination: targetEmail.toLowerCase(),
      provider: 'Configured Email Webhook',
      providerNote: `Provider Accepted: Email webhook returned HTTP ${res.status} for ${targetEmail}.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now,
      acceptedAt: now
    };
  } catch (err) {
    return {
      ...record,
      status: 'failed',
      destination: targetEmail,
      normalizedDestination: targetEmail.toLowerCase(),
      providerNote: `Dispatch Error: ${sanitizeProviderError(err)}`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }
}

/**
 * Dispatches Telegram notification via Official Telegram Bot API.
 * Strictly requires TELEGRAM_BOT_TOKEN and a verified TELEGRAM_CHAT_ID.
 * Never treats the public URL https://t.me/HEKA_480 as a valid Bot API chat_id by default.
 */
async function dispatchTelegramChannel(
  inquiry: CustomerInquiry,
  record: ChannelNotificationRecord,
  destinations: QuotationNotificationDestinations
): Promise<ChannelNotificationRecord> {
  const now = new Date().toISOString();
  const publicLink = destinations.telegramPublicLink || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.telegramPublicLink;
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || destinations.telegramChatId || '').trim();

  if (!destinations.enabledChannels.telegram) {
    return {
      ...record,
      status: 'not_configured',
      destination: publicLink,
      normalizedDestination: publicLink,
      providerNote: 'Channel disabled by administrator in notification settings.',
      lastAttemptAt: now
    };
  }

  const isValidChatId =
    Boolean(chatId) &&
    !chatId.startsWith('http://') &&
    !chatId.startsWith('https://');

  if (!botToken || !isValidChatId) {
    const missingParts: string[] = [];
    if (!botToken) missingParts.push('TELEGRAM_BOT_TOKEN');
    if (!isValidChatId) missingParts.push('TELEGRAM_CHAT_ID (numeric chat ID or authorized @channel)');

    return {
      ...record,
      status: 'not_configured',
      destination: publicLink,
      normalizedDestination: isValidChatId ? `chat_id:${chatId}` : publicLink,
      provider: 'Telegram Bot API',
      providerNote: `Not Configured: Public destination reference (${publicLink}) is recorded, but ${missingParts.join(' and ')} must be configured on the server. A public profile link is not a valid Bot API chat_id without bot initialization.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }

  try {
    const text = formatQuotationSummaryText(inquiry);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return {
        ...record,
        status: 'failed',
        destination: publicLink,
        normalizedDestination: `chat_id:${chatId}`,
        provider: 'Telegram Bot API',
        providerNote: `Telegram API Rejected (HTTP ${res.status}): ${sanitizeProviderError(data?.description || res.statusText)}`,
        attempts: record.attempts + 1,
        lastAttemptAt: now
      };
    }

    const messageId = data?.result?.message_id ? String(data.result.message_id) : undefined;
    return {
      ...record,
      status: 'sent_accepted',
      destination: publicLink,
      normalizedDestination: `chat_id:${chatId}`,
      provider: 'Telegram Bot API',
      providerMessageId: messageId,
      providerNote: `Provider Accepted: Delivered to Telegram chat_id ${chatId}${messageId ? ` (message_id: ${messageId})` : ''}.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now,
      acceptedAt: now
    };
  } catch (err) {
    return {
      ...record,
      status: 'failed',
      destination: publicLink,
      normalizedDestination: `chat_id:${chatId}`,
      provider: 'Telegram Bot API',
      providerNote: `Telegram Dispatch Error: ${sanitizeProviderError(err)}`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }
}

/**
 * Dispatches WhatsApp notification via Meta WhatsApp Business Cloud API.
 * Normalizes 0093728224060 -> +93728224060 (E.164) and 93728224060 (Cloud API recipient).
 */
async function dispatchWhatsAppChannel(
  inquiry: CustomerInquiry,
  record: ChannelNotificationRecord,
  destinations: QuotationNotificationDestinations
): Promise<ChannelNotificationRecord> {
  const now = new Date().toISOString();
  const rawPhone = destinations.whatsappRaw || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.whatsappRaw;
  const normalized = normalizeInternationalPhone(rawPhone);

  if (!destinations.enabledChannels.whatsapp) {
    return {
      ...record,
      status: 'not_configured',
      destination: rawPhone,
      normalizedDestination: normalized.e164,
      providerNote: 'Channel disabled by administrator in notification settings.',
      lastAttemptAt: now
    };
  }

  const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const templateName = (process.env.WHATSAPP_TEMPLATE_NAME || '').trim();

  if (!accessToken || !phoneNumberId) {
    const missing: string[] = [];
    if (!accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
    if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');

    return {
      ...record,
      status: 'not_configured',
      destination: rawPhone,
      normalizedDestination: normalized.e164,
      provider: 'Meta WhatsApp Business Cloud API',
      providerNote: `Not Configured: Destination ${rawPhone} (normalized E.164: ${normalized.e164}) is saved, but ${missing.join(' and ')} are not configured in server environment variables.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }

  try {
    const payload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: normalized.digitsOnly,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: inquiry.requestReference || inquiry.id },
                  { type: 'text', text: inquiry.productName || 'Commercial Inquiry' },
                  { type: 'text', text: `${inquiry.customerName} (${inquiry.customerContact})` }
                ]
              }
            ]
          }
        }
      : {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalized.digitsOnly,
          type: 'text',
          text: {
            preview_url: false,
            body: formatQuotationSummaryText(inquiry)
          }
        };

    const res = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const apiErr = data?.error?.message || res.statusText;
      return {
        ...record,
        status: 'failed',
        destination: rawPhone,
        normalizedDestination: normalized.e164,
        provider: 'Meta WhatsApp Business Cloud API',
        providerNote: `WhatsApp Cloud API Rejected (HTTP ${res.status}): ${sanitizeProviderError(apiErr)}`,
        attempts: record.attempts + 1,
        lastAttemptAt: now
      };
    }

    const wamid = data?.messages?.[0]?.id;
    return {
      ...record,
      status: 'sent_accepted',
      destination: rawPhone,
      normalizedDestination: normalized.e164,
      provider: 'Meta WhatsApp Business Cloud API',
      providerMessageId: wamid,
      providerNote: `Provider Accepted: Accepted by WhatsApp Business Cloud API for ${normalized.e164}${wamid ? ` (wamid: ${wamid})` : ''}.`,
      attempts: record.attempts + 1,
      lastAttemptAt: now,
      acceptedAt: now
    };
  } catch (err) {
    return {
      ...record,
      status: 'failed',
      destination: rawPhone,
      normalizedDestination: normalized.e164,
      provider: 'Meta WhatsApp Business Cloud API',
      providerNote: `WhatsApp Dispatch Error: ${sanitizeProviderError(err)}`,
      attempts: record.attempts + 1,
      lastAttemptAt: now
    };
  }
}

/**
 * Dispatches notifications for a persisted quotation request across Email, Telegram, and WhatsApp.
 * - Never throws or deletes the persisted inquiry.
 * - Avoids duplicate notifications by skipping channels already in 'sent_accepted' state unless explicitly forced.
 */
export async function dispatchQuotationNotifications(
  inquiry: CustomerInquiry,
  customDestinations?: Partial<QuotationNotificationDestinations>,
  options?: {
    targetChannels?: NotificationChannel[];
    forceDuplicateSend?: boolean;
  }
): Promise<QuotationNotificationMap> {
  const statusSummary = getNotificationProviderStatus(customDestinations);
  const { destinations } = statusSummary;

  const currentMap: QuotationNotificationMap =
    inquiry.notifications || createInitialNotificationMap(inquiry.id, destinations);

  const channelsToRun = options?.targetChannels || (['email', 'telegram', 'whatsapp'] as NotificationChannel[]);
  const updatedMap: QuotationNotificationMap = {
    email: { ...currentMap.email },
    telegram: { ...currentMap.telegram },
    whatsapp: { ...currentMap.whatsapp }
  };

  for (const ch of channelsToRun) {
    const existingRecord = updatedMap[ch];
    // Prevent duplicate notifications if already accepted by provider
    if (existingRecord.status === 'sent_accepted' && !options?.forceDuplicateSend) {
      continue;
    }

    if (ch === 'email') {
      updatedMap.email = await dispatchEmailChannel(inquiry, existingRecord, destinations);
    } else if (ch === 'telegram') {
      updatedMap.telegram = await dispatchTelegramChannel(inquiry, existingRecord, destinations);
    } else if (ch === 'whatsapp') {
      updatedMap.whatsapp = await dispatchWhatsAppChannel(inquiry, existingRecord, destinations);
    }
  }

  return updatedMap;
}
