import { useCallback, useEffect, useState } from "react";
import api from "../pages/services/api";

export default function useApi(url, select = (r) => r) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        api.get(url)
            .then(({ data }) => alive && setData(select(data)))
            .catch((err) => alive && setError(err.response?.data?.message || "Data load nahi ho paya."))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, tick]);

    const reload = useCallback(() => setTick((t) => t + 1), []);
    return { data, loading, error, reload };
}