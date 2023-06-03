import { PLATFORM_ID } from "@gitcoin/passport-types";
import { CacheToken } from "../types";
import crypto from "crypto";

class PlatformsDataCache {
  cache: Record<CacheToken, Partial<Record<PLATFORM_ID, Record<string, any>>>> = {};

  timeouts: Record<CacheToken, NodeJS.Timeout> = {};

  // Initial timeout is a bit longer than the default timeout
  // to allow for user input in e.g. oauth flows
  initialTimeout: number = 1000 * 60 * 5; // 5 minutes
  timeout: number = 1000 * 60 * 3; // 3 minutes

  constructor() {}

  initSession(token?: CacheToken): CacheToken {
    const cacheToken = token || crypto.randomBytes(32).toString("hex");

    this.cache[cacheToken] = {};
    this._setTimeout(cacheToken, this.initialTimeout);

    return cacheToken;
  }

  clearSession(cacheToken: CacheToken) {
    if (this.timeouts[cacheToken]) {
      delete this.timeouts[cacheToken];
    }
    if (this.cache[cacheToken]) {
      delete this.cache[cacheToken];
    }
  }

  async get<T>(
    cacheToken: CacheToken,
    platform: PLATFORM_ID,
    key: string,
    generatorFunc?: () => Promise<T>
  ): Promise<T> {
    if (!this.cache[cacheToken]) throw new Error(`No session found for id ${cacheToken}`);

    this._clearTimeout(cacheToken);

    if (!this.cache[cacheToken][platform]) this.cache[cacheToken][platform] = {};
    if (!this.cache[cacheToken][platform][key] && generatorFunc)
      this.cache[cacheToken][platform][key] = await generatorFunc();

    this._setTimeout(cacheToken);

    return this.cache[cacheToken][platform][key];
  }

  _clearTimeout(cacheToken: CacheToken) {
    if (this.timeouts[cacheToken]) {
      clearTimeout(this.timeouts[cacheToken]);
      delete this.timeouts[cacheToken];
    }
  }

  _setTimeout(cacheToken: CacheToken, overrideTimeout?: number) {
    this.timeouts[cacheToken] = setTimeout(() => {
      delete this.cache[cacheToken];
      delete this.timeouts[cacheToken];
    }, overrideTimeout || this.timeout);
  }
}

const platformsDataCache = new PlatformsDataCache();

class CacheSession {
  cacheToken: CacheToken;
  platform: PLATFORM_ID;

  constructor(cacheToken: CacheToken, platform: PLATFORM_ID) {
    this.cacheToken = cacheToken;
    this.platform = platform;
  }

  async get<T>(key: string, generatorFunc?: () => Promise<T>): Promise<T> {
    return platformsDataCache.get<T>(this.cacheToken, this.platform, key, generatorFunc);
  }
}

// Must be called to initiate a session
// A token is only needed if your platform requires the token to be in a
// specific format, otherwise a random token is automatically generated
export const initCacheSession = (token?: CacheToken): CacheToken => {
  console.log("Initializing cache session");
  return platformsDataCache.initSession(token);
};

// Right now the cache is only used by a single platform at a time,
// but the platform argument is used to support bulk requests in the future
export const loadCacheSession = (cacheToken: CacheToken, platform: PLATFORM_ID): CacheSession => {
  console.log(`Loading cache session ${cacheToken}, ${platform}`);
  return new CacheSession(cacheToken, platform);
};

export const clearCacheSession = (cacheToken: CacheToken) => {
  console.log(`Clearing cache session ${cacheToken}`);
  platformsDataCache.clearSession(cacheToken);
};
