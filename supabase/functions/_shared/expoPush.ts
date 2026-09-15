// Expo Push Notification client helper (Architecture Section 8, 9.2, 11)

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

export interface SendPushResult {
  success: boolean;
  ticket?: ExpoPushTicket;
  error?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Validate whether a token string is a valid Expo Push token format
 */
export function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

/**
 * Send a single push notification through Expo Push Service
 */
export async function sendExpoPushNotification(message: ExpoPushMessage): Promise<SendPushResult> {
  if (!isExpoPushToken(message.to)) {
    return {
      success: false,
      error: `Invalid Expo Push Token format: ${message.to}`,
    };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sound: 'default',
        priority: 'high',
        ...message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Expo Push API HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const ticket: ExpoPushTicket = data.data?.[0] ?? data.data;

    if (ticket?.status === 'error') {
      return {
        success: false,
        ticket,
        error: ticket.message || ticket.details?.error || 'Unknown Expo push error',
      };
    }

    return {
      success: true,
      ticket,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to send push notification: ${errorMessage}`,
    };
  }
}

/**
 * Send batch push notifications (up to 100 messages per chunk per Expo recommendations)
 */
export async function sendBatchExpoPushNotifications(messages: ExpoPushMessage[]): Promise<SendPushResult[]> {
  const validMessages = messages.filter((msg) => isExpoPushToken(msg.to));
  if (validMessages.length === 0) {
    return [];
  }

  const results: SendPushResult[] = [];
  const chunkSize = 100;

  for (let i = 0; i < validMessages.length; i += chunkSize) {
    const chunk = validMessages.slice(i, i + chunkSize);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk.map((msg) => ({ sound: 'default', priority: 'high', ...msg }))),
      });

      if (!response.ok) {
        const errorText = await response.text();
        results.push(...chunk.map(() => ({ success: false, error: `Batch HTTP error ${response.status}: ${errorText}` })));
        continue;
      }

      const data = await response.json();
      const tickets: ExpoPushTicket[] = Array.isArray(data.data) ? data.data : [data.data];

      for (let j = 0; j < chunk.length; j++) {
        const ticket = tickets[j];
        if (ticket?.status === 'error') {
          results.push({
            success: false,
            ticket,
            error: ticket.message || ticket.details?.error || 'Unknown error',
          });
        } else {
          results.push({ success: true, ticket });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(...chunk.map(() => ({ success: false, error: msg })));
    }
  }

  return results;
}
