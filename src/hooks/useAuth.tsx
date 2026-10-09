import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/**
 * Current staff member: makes sure a profile row exists (first ever account
 * becomes admin) and reads the role from the separate user_roles table.
 */
export function useStaff() {
  const { session, loading } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: ["staff", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: profile, error } = await supabase.rpc("ensure_profile");
      if (error) throw error;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (rolesError) throw rolesError;

      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      return {
        profile: profile as { id: string; email: string; full_name: string | null; is_active: boolean },
        isAdmin,
      };
    },
  });

  return {
    session,
    loading: loading || query.isLoading,
    profile: query.data?.profile ?? null,
    isAdmin: query.data?.isAdmin ?? false,
    email: session?.user?.email ?? "",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
