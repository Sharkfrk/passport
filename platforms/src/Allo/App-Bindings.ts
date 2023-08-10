import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class AlloPlatform extends Platform {
  platformId = "Allo";
  path = "Allo";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
