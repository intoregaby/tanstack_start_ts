import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      if (provider === "lovable") {
        return { error: new Error("Unsupported auth provider") };
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: (provider === "microsoft" ? "azure" : provider) as "google" | "apple" | "azure",
        options: {
          redirectTo: opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined),
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error };
      return { redirected: true, data };
    },
  },
};
