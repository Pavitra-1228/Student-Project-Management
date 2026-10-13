import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const counter = useRef(0);

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++counter.current;
    if (!silent) setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === counter.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (id === counter.current) setState((current) => ({ ...current, loading: false, error }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    return () => {
      counter.current += 1;
    };
  }, deps);

  const setData = useCallback(
    (updater) => setState((current) => ({ ...current, data: typeof updater === 'function' ? updater(current.data) : updater })),
    []
  );

  return { ...state, reload: run, setData };
}

export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
