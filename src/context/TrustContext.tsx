import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { API_URL } from "@/src/api_config";
import { useUser } from "./UserContext";

export interface TrustLevelInfo {
  trust_score: number;
  trust_level: string;
  trust_level_title: string;
  multiplier: number;
  updated_at?: string;
}

export interface TrustHistoryItem {
  delta: number;
  score_before: number;
  score_after: number;
  reason: string;
  triggered_by: string;
  timestamp: string;
}

export interface TrustStatus extends TrustLevelInfo {
  trust_history: TrustHistoryItem[];
}

interface TrustContextType {
  trustStatus: TrustStatus | null;
  loading: boolean;
  refreshTrust: () => Promise<void>;
  updateTrustScore: (
    delta: number,
    reason: string,
    targetUsername?: string,
  ) => Promise<boolean>;
}

const TrustContext = createContext<TrustContextType | undefined>(undefined);

export const TrustProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [trustStatus, setTrustStatus] = useState<TrustStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshTrust = useCallback(async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const ts = Date.now();
      const safeName = encodeURIComponent(user.username);
      const res = await fetch(`${API_URL}/trust/${safeName}?_t=${ts}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data: TrustStatus = await res.json();
        setTrustStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch trust status:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  const updateTrustScore = useCallback(
    async (
      delta: number,
      reason: string,
      targetUsername?: string,
    ): Promise<boolean> => {
      const who = targetUsername || user?.username;
      if (!who) return false;

      try {
        const res = await fetch(`${API_URL}/trust/score/change`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: who,
            delta,
            reason,
            triggered_by: "parent",
          }),
        });
        if (res.ok) {
          // Refresh the current user's own trust if they changed themselves,
          // otherwise just return success (parent view will refetch family data)
          if (!targetUsername) await refreshTrust();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to update trust score:", err);
        return false;
      }
    },
    [user?.username, refreshTrust],
  );

  // Auto-refresh on mount and when user changes
  useEffect(() => {
    if (user?.username) {
      refreshTrust();
    } else {
      setTrustStatus(null);
    }
  }, [user?.username, refreshTrust]);

  return (
    <TrustContext.Provider
      value={{ trustStatus, loading, refreshTrust, updateTrustScore }}
    >
      {children}
    </TrustContext.Provider>
  );
};

export const useTrust = (): TrustContextType => {
  const context = useContext(TrustContext);
  if (context === undefined) {
    throw new Error("useTrust must be used within a TrustProvider");
  }
  return context;
};
