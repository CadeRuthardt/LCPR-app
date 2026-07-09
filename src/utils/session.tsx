import type { Session, User } from "@supabase/supabase-js";
import * as React from "react";

import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";
import { getCurrentClientProfile } from "@/services/client-data";
import type { ClientProfile } from "@/types/database";
import { getFriendlyAuthError } from "@/utils/auth-errors";

type SessionContextValue = {
  authError: string | null;
  client: ClientProfile | null;
  isConfigured: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  sendEmailCode: (email: string) => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

type SessionProviderProps = React.PropsWithChildren;

export function SessionProvider({ children }: SessionProviderProps) {
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [client, setClient] = React.useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [session, setSession] = React.useState<Session | null>(null);

  const loadClient = React.useCallback(async (activeSession: Session | null) => {
    setSession(activeSession);

    if (!activeSession?.user) {
      setClient(null);
      return;
    }

    const profile = await getCurrentClientProfile(activeSession.user.id);
    setClient(profile);
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(getFriendlyAuthError(error));
          return;
        }

        await loadClient(data.session);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setAuthError(getFriendlyAuthError(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void loadClient(nextSession).catch((error: unknown) => {
        setAuthError(getFriendlyAuthError(error));
      });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadClient]);

  const sendEmailCode = React.useCallback(async (email: string) => {
    setAuthError(null);

    const { error } = await requireSupabase().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      setAuthError(getFriendlyAuthError(error));
      throw error;
    }
  }, []);

  const verifyEmailCode = React.useCallback(
    async (email: string, code: string) => {
      setAuthError(null);

      const { data, error } = await requireSupabase().auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        setAuthError(getFriendlyAuthError(error));
        throw error;
      }

      await loadClient(data.session);
    },
    [loadClient],
  );

  const signOut = React.useCallback(async () => {
    setAuthError(null);

    const { error } = await requireSupabase().auth.signOut();

    if (error) {
      setAuthError(getFriendlyAuthError(error));
      throw error;
    }

    setClient(null);
    setSession(null);
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      authError,
      client,
      isConfigured: isSupabaseConfigured,
      isLoading,
      isSignedIn: Boolean(session?.user),
      sendEmailCode,
      session,
      signOut,
      user: session?.user ?? null,
      verifyEmailCode,
    }),
    [
      authError,
      client,
      isLoading,
      sendEmailCode,
      session,
      signOut,
      verifyEmailCode,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = React.use(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
