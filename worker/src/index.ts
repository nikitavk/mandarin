export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
}

interface ScoreSubmission {
  odaUserId: string;  // String to support Telegram (numeric), LINE (string), and web (uuid) IDs
  odaName: string;
  time: number;
  streak?: number;
  streakTime?: number;
  streakId?: string;  // Unique ID for this streak run
  cellCount?: number;
  platform?: 'telegram' | 'line' | 'web';
}

interface TelegramUpdate {
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
    };
  };
  inline_query?: {
    id: string;
    from: { id: number; first_name: string };
    query: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Handle Telegram webhook for payment confirmations
    if (request.method === 'POST' && path === '/webhook') {
      try {
        const update = await request.json() as TelegramUpdate;

        // Handle pre-checkout query - must respond within 10 seconds
        if (update.pre_checkout_query) {
          await answerPreCheckoutQuery(env.BOT_TOKEN, update.pre_checkout_query.id, true);
          return new Response('OK');
        }

        // Handle successful payment (optional - for logging/thank you messages)
        if (update.message?.successful_payment) {
          console.log('Payment received:', update.message.successful_payment);
        }

        // Handle inline query for sharing
        if (update.inline_query) {
          const query = update.inline_query.query;
          const cells = parseInt(query) || 1;
          // Round to nearest odd number (1,3,5...23)
          const validCells = Math.min(23, Math.max(1, cells % 2 === 0 ? cells + 1 : cells));

          await answerInlineQuery(env.BOT_TOKEN, update.inline_query.id, validCells);
          return new Response('OK');
        }

        return new Response('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response('OK'); // Always return OK to Telegram
      }
    }

    try {
      // POST /score - Submit a score
      if (request.method === 'POST' && path === '/score') {
        const body = await request.json() as ScoreSubmission;

        if (!body.odaUserId || !body.time || typeof body.time !== 'number') {
          return jsonResponse({ error: 'Invalid request' }, 400);
        }

        const platform = body.platform || 'telegram';
        const cellCount = body.cellCount || 1;
        const streak = body.streak || 0;
        const streakTime = body.streakTime || 0;
        const streakId = body.streakId || null;

        // Check if user already has a score for this cellCount
        const existing = await env.DB.prepare(
          'SELECT time, streak, streakTime, streakId FROM scores WHERE odaUserId = ? AND cellCount = ?'
        ).bind(body.odaUserId, cellCount).first<{ time: number; streak: number; streakTime: number; streakId: string | null }>();

        if (existing) {
          // Update time if better (independent of streak)
          // Update streak/streakTime/streakId only if new streak is better
          const newTime = body.time < existing.time ? body.time : existing.time;
          const streakImproved = streak > existing.streak;
          const newStreak = streakImproved ? streak : existing.streak;
          const newStreakTime = streakImproved ? streakTime : existing.streakTime;
          const newStreakId = streakImproved ? streakId : existing.streakId;

          if (body.time < existing.time || streakImproved) {
            await env.DB.prepare(
              'UPDATE scores SET time = ?, streak = ?, streakTime = ?, streakId = ?, odaName = ?, platform = ?, updatedAt = ? WHERE odaUserId = ? AND cellCount = ?'
            ).bind(newTime, newStreak, newStreakTime, newStreakId, body.odaName || 'Player', platform, Date.now(), body.odaUserId, cellCount).run();
          }
        } else {
          // Insert new score
          await env.DB.prepare(
            'INSERT INTO scores (odaUserId, odaName, time, streak, streakTime, streakId, cellCount, platform, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(body.odaUserId, body.odaName || 'Player', body.time, streak, streakTime, streakId, cellCount, platform, Date.now(), Date.now()).run();
        }

        // Get user's rank for this cellCount
        const rank = await getUserRank(env.DB, body.odaUserId, cellCount);
        const bestTime = await getUserBestTime(env.DB, body.odaUserId, cellCount);

        return jsonResponse({
          success: true,
          rank,
          bestTime,
        });
      }

      // GET /leaderboard - Get top scores
      // Query params: limit, platform, cellCount, sortBy (time|streak|streakTime)
      if (request.method === 'GET' && path === '/leaderboard') {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
        const platformFilter = url.searchParams.get('platform'); // Optional: 'telegram', 'line', or null for all
        const cellCountFilter = url.searchParams.get('cellCount'); // Optional: filter by cell count
        const sortBy = url.searchParams.get('sortBy') || 'time'; // 'time', 'streak', or 'streakTime'

        let query: string;
        const params: (string | number)[] = [];

        const validPlatforms = ['telegram', 'line', 'web'];
        const hasPlatformFilter = platformFilter && validPlatforms.includes(platformFilter);

        if (sortBy === 'streak') {
          // For streak leaderboard: get each user's best streak (max streak across all cellCounts)
          // Use a subquery to find the row with max streak for each user
          query = `
            SELECT s.odaUserId, s.odaName, s.time, s.streak, s.streakTime, s.cellCount, s.platform
            FROM scores s
            INNER JOIN (
              SELECT odaUserId, MAX(streak) as maxStreak
              FROM scores
              ${hasPlatformFilter ? 'WHERE platform = ?' : ''}
              GROUP BY odaUserId
            ) m ON s.odaUserId = m.odaUserId AND s.streak = m.maxStreak
            ${hasPlatformFilter ? 'WHERE s.platform = ?' : ''}
            ORDER BY s.streak DESC, s.streakTime ASC
            LIMIT ?
          `;
          if (hasPlatformFilter) {
            params.push(platformFilter, platformFilter);
          }
          params.push(limit);
        } else {
          // For time/streakTime leaderboard: filter by cellCount
          query = 'SELECT odaUserId, odaName, time, streak, streakTime, cellCount, platform FROM scores';
          const conditions: string[] = [];

          if (hasPlatformFilter) {
            conditions.push('platform = ?');
            params.push(platformFilter);
          }

          if (cellCountFilter) {
            const cellCount = parseInt(cellCountFilter);
            if (!isNaN(cellCount) && cellCount > 0) {
              conditions.push('cellCount = ?');
              params.push(cellCount);
            }
          }

          if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
          }

          if (sortBy === 'streakTime') {
            query += ' ORDER BY streakTime DESC, time ASC';
          } else {
            query += ' ORDER BY time ASC';
          }

          query += ' LIMIT ?';
          params.push(limit);
        }

        const results = await env.DB.prepare(query).bind(...params).all<{
          odaUserId: string;
          odaName: string;
          time: number;
          streak: number;
          streakTime: number;
          cellCount: number;
          platform: string;
        }>();

        return jsonResponse({
          leaderboard: results.results.map((row, index) => ({
            rank: index + 1,
            odaUserId: row.odaUserId,
            odaName: row.odaName,
            time: row.time,
            streak: row.streak || 0,
            streakTime: row.streakTime || 0,
            cellCount: row.cellCount || 1,
            platform: row.platform || 'telegram',
          })),
        });
      }

      // GET /rank/:odaUserId - Get user's rank
      // Query params: cellCount (optional, defaults to 1)
      if (request.method === 'GET' && path.startsWith('/rank/')) {
        const odaUserId = decodeURIComponent(path.split('/')[2]);
        const cellCount = parseInt(url.searchParams.get('cellCount') || '1') || 1;

        if (!odaUserId) {
          return jsonResponse({ error: 'Invalid user ID' }, 400);
        }

        const rank = await getUserRank(env.DB, odaUserId, cellCount);
        const bestTime = await getUserBestTime(env.DB, odaUserId, cellCount);
        const stats = await getUserStats(env.DB, odaUserId, cellCount);
        const total = await getTotalPlayers(env.DB, cellCount);

        if (rank === null) {
          return jsonResponse({ error: 'User not found' }, 404);
        }

        return jsonResponse({
          rank,
          bestTime,
          total,
          streak: stats?.streak || 0,
          streakTime: stats?.streakTime || 0,
        });
      }

      // POST /donate - Create Stars donation invoice
      if (request.method === 'POST' && path === '/donate') {
        const body = await request.json() as { stars?: number };
        const stars = body.stars || 50;

        if (stars < 1 || stars > 100000) {
          return jsonResponse({ error: 'Invalid stars amount' }, 400);
        }

        if (!env.BOT_TOKEN) {
          return jsonResponse({ error: 'Bot token not configured' }, 500);
        }

        const invoiceUrl = await createStarsInvoice(env.BOT_TOKEN, stars);
        if (!invoiceUrl) {
          return jsonResponse({ error: 'Failed to create invoice' }, 500);
        }

        return jsonResponse({ invoiceUrl });
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function getUserRank(db: D1Database, odaUserId: string, cellCount: number = 1): Promise<number | null> {
  const result = await db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM scores
    WHERE cellCount = ? AND time < (SELECT time FROM scores WHERE odaUserId = ? AND cellCount = ?)
  `).bind(cellCount, odaUserId, cellCount).first<{ rank: number }>();

  // Check if user exists for this cellCount
  const exists = await db.prepare(
    'SELECT 1 FROM scores WHERE odaUserId = ? AND cellCount = ?'
  ).bind(odaUserId, cellCount).first();

  if (!exists) return null;
  return result?.rank ?? null;
}

async function getUserBestTime(db: D1Database, odaUserId: string, cellCount: number = 1): Promise<number | null> {
  const result = await db.prepare(
    'SELECT time FROM scores WHERE odaUserId = ? AND cellCount = ?'
  ).bind(odaUserId, cellCount).first<{ time: number }>();
  return result?.time ?? null;
}

async function getUserStats(db: D1Database, odaUserId: string, cellCount: number = 1): Promise<{ streak: number; streakTime: number } | null> {
  const result = await db.prepare(
    'SELECT streak, streakTime FROM scores WHERE odaUserId = ? AND cellCount = ?'
  ).bind(odaUserId, cellCount).first<{ streak: number; streakTime: number }>();
  return result ?? null;
}

async function getTotalPlayers(db: D1Database, cellCount?: number): Promise<number> {
  if (cellCount) {
    const result = await db.prepare('SELECT COUNT(*) as count FROM scores WHERE cellCount = ?').bind(cellCount).first<{ count: number }>();
    return result?.count ?? 0;
  }
  const result = await db.prepare('SELECT COUNT(DISTINCT odaUserId) as count FROM scores').first<{ count: number }>();
  return result?.count ?? 0;
}

async function createStarsInvoice(botToken: string, stars: number): Promise<string | null> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Support the Developer',
      description: `Donate ${stars} Stars to support Mandarin game development`,
      payload: `donate_${stars}_${Date.now()}`,
      provider_token: '', // Empty string for Telegram Stars
      currency: 'XTR',
      prices: [{ label: 'Stars', amount: stars }],
    }),
  });

  const data = await response.json() as { ok: boolean; result?: string };
  return data.ok ? data.result ?? null : null;
}

async function answerPreCheckoutQuery(botToken: string, queryId: string, ok: boolean): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
    }),
  });
}

async function answerInlineQuery(botToken: string, queryId: string, cells: number): Promise<void> {
  const imageUrl = `https://nikitavk.github.io/mandarin/win_pics/${cells}.jpg`;
  const gameUrl = 'https://t.me/MANDARINMANDARINbot/MANDARIN';
  const caption = `🍊 Я почистил ${cells} ${getMandarinWord(cells)} для тебя!\nСможешь быстрее?`;

  await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: [
        {
          type: 'photo',
          id: `share_${cells}`,
          photo_url: imageUrl,
          thumbnail_url: imageUrl,
          caption,
          reply_markup: {
            inline_keyboard: [[
              { text: '🎮 Играть', url: gameUrl }
            ]]
          }
        }
      ],
      cache_time: 0,
    }),
  });
}

function getMandarinWord(n: number): string {
  if (n === 1) return 'мандарин';
  if (n >= 2 && n <= 4) return 'мандарина';
  return 'мандаринов';
}
