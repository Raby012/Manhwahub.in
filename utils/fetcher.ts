import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import pRetry, { AbortError } from 'p-retry';
import pTimeout from 'p-timeout';

// Error types for better handling in UI
export enum FetchErrorType {
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ABORTED = 'ABORTED',
  UNKNOWN = 'UNKNOWN'
}

export interface FetcherErrorDetails {
  type: FetchErrorType;
  status?: number;
  message: string;
  url: string;
}

export const getFetcherError = (error: any, url: string): FetcherErrorDetails => {
  if (error.name === 'TimeoutError') {
    return { type: FetchErrorType.TIMEOUT, message: 'Request timed out. The server took too long to respond.', url };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) {
      return { type: FetchErrorType.RATE_LIMIT, status, message: 'Too many requests. Please wait a moment before trying again.', url };
    }
    if (status === 404) {
      return { type: FetchErrorType.NOT_FOUND, status, message: 'The requested resource could not be found.', url };
    }
    if (status && status >= 500) {
      return { type: FetchErrorType.SERVER_ERROR, status, message: 'The server encountered an error. Please try again later.', url };
    }
    return { type: FetchErrorType.NETWORK_ERROR, status, message: error.message || 'A network error occurred.', url };
  }

  return { type: FetchErrorType.UNKNOWN, message: error.message || 'An unexpected error occurred.', url };
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
];

export const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export const fetcher = async (url: string, config: AxiosRequestConfig = {}) => {
  return pRetry(
    async () => {
      try {
        const response = await pTimeout(
          axios({
            url,
            ...config,
            headers: {
              'User-Agent': getRandomUA(),
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1',
              ...config.headers
            }
          }),
          { milliseconds: 45000 } // Increased to 45s for slower aggregators/cold starts
        );
        return response;
      } catch (err: any) {
        const errorInfo = getFetcherError(err, url);
        
        // Handle Aborts
        if (err.response?.status >= 400 && err.response?.status < 500 && err.response?.status !== 429) {
          console.error(`Fetch Auto-Abort [${url}]: Status ${err.response.status}`);
          throw new AbortError(err);
        }
        
        console.error(`Fetch Error [${errorInfo.type}] [${url}]: ${errorInfo.message}`);
        throw err;
      }
    },
    {
      retries: 1,
      minTimeout: 2000,
      onFailedAttempt: (error: any) => {
        const errorInfo = getFetcherError(error, url);
        console.warn(`[RETRY] Attempt ${error.attemptNumber} failed for ${url}. ${error.retriesLeft} retries left. Reason: ${errorInfo.message}`);
      }
    }
  );
};

