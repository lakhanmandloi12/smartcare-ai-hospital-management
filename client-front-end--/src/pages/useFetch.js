import { useCallback, useEffect, useState } from "react";
import api from "../pages/services/api";

// GET request + loading/error state. `pick` response me se kaam ka hissa nikalta hai.
export default function useFetch(url, pick) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data: res } = await api.get(url);
            setData(pick ? pick(res) : res);
        } catch (err) {
            setError(err.response?.data?.message || "Data load nahi ho paaya. Dobara try karo.");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load };
}
