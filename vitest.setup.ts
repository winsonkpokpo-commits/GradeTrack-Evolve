import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * Mock complet du client Supabase navigateur (lib/supabase/client).
 * Aucun appel réseau réel : recupererJeton() (lib/api/notes.ts) appelle
 * `createClient().auth.getSession()` et attend un token.
 */
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "jeton-test" } },
      }),
    },
  })),
}));