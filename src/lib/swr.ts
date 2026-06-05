// src/lib/swr.ts
// Shared SWR fetcher for client-side GET data. SWR gives us caching, request
// dedup across components and revalidation-on-focus for free — replacing the
// ad-hoc `useState` + `useEffect(fetch)` pattern scattered across the app.
export const fetcher = async <T = unknown>(url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json() as Promise<T>;
};
