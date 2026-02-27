"use client";

import type { DataProvider, SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { searchPantryHistory } from "@/web-client/data-provider/rest/pantry-history";
import { searchPantryEntries } from "@/web-client/data-provider/rest/pantry-entries";
import { searchPantryExits } from "@/web-client/data-provider/rest/pantry-exits";
import { searchPantryStock } from "@/web-client/data-provider/rest/pantry-stock";
import { searchPantryItems } from "@/web-client/data-provider/rest/pantry-items";
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
        case "pantry.entries":
          return (await searchPantryEntries(authToken, args)) as unknown as SearchResult<T>;
        case "pantry.exits":
          return (await searchPantryExits(authToken, args)) as unknown as SearchResult<T>;
        case "pantry.stock":
          return (await searchPantryStock(authToken, args)) as unknown as SearchResult<T>;
        case "pantry.items":
          return (await searchPantryItems(authToken, args)) as unknown as SearchResult<T>;
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
