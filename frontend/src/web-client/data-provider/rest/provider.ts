"use client";

import type { DataProvider, SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { searchPantryDonors } from "@/web-client/data-provider/rest/pantry-donors";
import { searchPantryHistory } from "@/web-client/data-provider/rest/pantry-history";
import { searchPantryStock } from "@/web-client/data-provider/rest/pantry-stock";
import {
  createPantryItem,
  deletePantryItem,
  getPantryItem,
  updatePantryItem,
} from "@/modules/pantry/api";

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
        case "pantry.donors":
          return (await searchPantryDonors(authToken, args)) as unknown as SearchResult<T>;
        case "pantry.stock":
          return (await searchPantryStock(authToken, args)) as unknown as SearchResult<T>;
        default:
          throw new Error(`Model nao suportado: ${model}`);
      }
    },
    async read<T>(model: string, id: string) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          return (await getPantryItem(authToken, id)) as unknown as T;
        default:
          throw new Error(`read() nao implementado para ${model}`);
      }
    },
    async create<T>(model: string, payload: unknown) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          return (await createPantryItem(authToken, payload as never)) as unknown as T;
        default:
          throw new Error(`create() nao implementado para ${model}`);
      }
    },
    async update<T>(model: string, id: string, payload: unknown) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          return (await updatePantryItem(authToken, id, payload as never)) as unknown as T;
        default:
          throw new Error(`update() nao implementado para ${model}`);
      }
    },
    async delete(model: string, id: string) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          await deletePantryItem(authToken, id);
          return;
        default:
          throw new Error(`delete() nao implementado para ${model}`);
      }
    },
  };
}
