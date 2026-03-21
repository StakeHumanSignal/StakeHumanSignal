export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = {
  getReviews: async () => {
    const r = await fetch(`${API}/reviews`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.reviews ?? data ?? [];
  },
  submitReview: async (data: Record<string, unknown>) => {
    const r = await fetch(`${API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  getAgentLog: async () => {
    const r = await fetch(`${API}/agent/log`);
    return r.ok ? r.json() : [];
  },
  getLeaderboard: async () => {
    const r = await fetch(`${API}/leaderboard`);
    return r.ok ? r.json() : [];
  },
};
