import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      try {
        const result = await lovableAuth.signInWithOAuth(provider, {
          redirect_uri: opts?.redirect_uri,
          extraParams: opts?.extraParams,
        });

        if (result.redirected || result.error) {
          return result;
        }

        if (result.tokens) {
          await supabase.auth.setSession(result.tokens);
        }
        return result;
      } catch {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: (provider === "microsoft" ? "azure" : provider) as "google" | "apple" | "azure",
          options: {
            redirectTo: opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined),
            queryParams: opts?.extraParams,
          },
        });
        if (error) return { error };
        return { redirected: true, data };
      }
    },
  },
};
