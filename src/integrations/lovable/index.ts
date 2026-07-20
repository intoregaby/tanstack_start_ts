import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: (provider === "microsoft" ? "azure" : provider) as "google" | "apple" | "azure",
        options: {
          redirectTo: opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined),
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        if (error.message.includes("missing OAuth secret") || error.message.includes("validation_failed") || error.message.includes("Unsupported provider")) {
          return {
            error: new Error(
              "Google Provider needs to be enabled in your Supabase Auth settings. You can sign up/in immediately using Email & Password below!"
            ),
          };
        }
        return { error };
      }
      return { redirected: true, data };
    },
  },
};
