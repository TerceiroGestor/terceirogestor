"use client";

import type { DataProvider, SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { searchPantryHistory } from "@/web-client/data-provider/rest/pantry-history";

export function createRestDataProvider({ token }: { token: string | null }): DataProvider {
  async function assertToken() {
    if (!token) {
      throw new Error("Token ausente.");
    }
    return token;
  }

  return {
    async search<T>(model: string, args: SearchArgs) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.history":
          return (await searchPantryHistory(authToken, args)) as unknown as SearchResult<T>;
        default:
          throw new Error(`Model nao suportado: ${model}`);
      }
    },
    async read(model) {
      throw new Error(`read() nao implementado para ${model}`);
    },
    async create(model) {
      throw new Error(`create() nao implementado para ${model}`);
    },
    async update(model) {
      throw new Error(`update() nao implementado para ${model}`);
    },
    async delete(model) {
      throw new Error(`delete() nao implementado para ${model}`);
    },
  };
}
