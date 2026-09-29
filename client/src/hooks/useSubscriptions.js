import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

// one owner for subscription data so overview / list / timeline can't drift apart.
// the server derives ownership from the JWT — nothing here ever sends a userId
export default function useSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/subscriptions");
      setSubs(data.subscriptions || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (payload) => {
      const { data } = await api.post("/subscriptions", payload);
      await reload();
      return data.subscription;
    },
    [reload]
  );

  const update = useCallback(
    async (id, patch) => {
      const { data } = await api.put(`/subscriptions/${id}`, patch);
      await reload();
      return data.subscription;
    },
    [reload]
  );

  const remove = useCallback(
    async (id) => {
      await api.delete(`/subscriptions/${id}`);
      await reload();
    },
    [reload]
  );

  return { subs, loading, error, reload, create, update, remove };
}
