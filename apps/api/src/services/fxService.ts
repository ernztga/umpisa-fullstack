import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Temporarily commented out, switch to fastforex API
// interface ExchangeRateResponse {
//   result: string;
//   conversion_rate?: number;
// }

export interface ExchangeRateResponse {
  base: string;
  amount: number;
  result: {
    [currencyCode: string]: number;
    rate: number;
  };
  ms: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (for currency)

interface CacheEntry {
  rate: number;
  expiresAt: number;
}

const rateCache = new Map<string, CacheEntry>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a single currency conversion rate from the external FX API,
 * retrying on transient failures (network errors, 5xx responses) with
 * exponential backoff.
 * @returns `null` (never throws) if all attempts are exhausted, so a
 * third-party outage degrades the "converted amount" display feature
 * instead of breaking the whole expenses query.
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rate;
  }

  const url = `${env.FX_API_BASE_URL}/convert?from=${fromCurrency}&to=${toCurrency}&amount=1&api_key=${env.FX_API_KEY}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      // 4xx means request was malformed
      if (response.status >= 400 && response.status < 500) {
        logger.warn(
          { fromCurrency, toCurrency, status: response.status },
          'FX API rejected request',
        );
        return null;
      }

      if (!response.ok) {
        throw new Error(`FX API responded with status ${response.status}`);
      }

      const data = (await response.json()) as ExchangeRateResponse;
      // return data.conversion_rate ?? null; Temporarily switched to fastforex API

      const rate = data.result?.rate ?? null;

      if (rate !== null) {
        rateCache.set(cacheKey, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
      }

      return rate;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      logger.warn(
        { err: error, attempt, fromCurrency, toCurrency },
        isLastAttempt ? 'FX API call failed, no more retries' : 'FX API call failed, retrying',
      );

      if (isLastAttempt) return null;

      await delay(BASE_DELAY_MS * 2 ** (attempt - 1)); // 200ms, 400ms, 800ms
    }
  }

  return null;
}
