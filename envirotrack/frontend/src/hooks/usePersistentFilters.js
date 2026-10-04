import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';

const SAVE_DELAY_MS = 600;

export const emptyFilters = (scope) => ({
  responsible: [],
  [scope === 'buildings' ? 'buildings' : 'rooms']: [],
  mine: false,
  start_date: '',
  end_date: '',
});

const storageKey = (scope, user) => `envirotrack.filters.${scope}.${user ? user.user_id : 'guest'}`;

const readLocal = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode: the server copy is still authoritative.
  }
};

/**
 * Filter state that belongs to the signed-in user.
 *
 * The browser copy (per user id) makes the list render instantly; the server copy
 * (/api/filter_preferences/<scope>/) follows the user to other computers. A user who is
 * linked to a «Ответственный» and has never saved anything starts on «Мои помещения».
 */
const usePersistentFilters = (scope) => {
  const { user, authTokens } = useContext(AuthContext);
  const key = storageKey(scope, user);
  const defaults = useCallback(() => emptyFilters(scope), [scope]);

  const [filters, setFiltersState] = useState(() => ({ ...defaults(), ...readLocal(key) }));
  const [ready, setReady] = useState(!user);
  const [responsibleId, setResponsibleId] = useState(null);
  const [saveState, setSaveState] = useState('idle');

  const touchedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const tokenRef = useRef(authTokens);
  tokenRef.current = authTokens;

  const saveToServer = useCallback(
    (next) => {
      if (!user) return;
      clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/filter_preferences/${scope}/`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + String(tokenRef.current?.access),
            },
            body: JSON.stringify({ filters: next }),
          });
          setSaveState(response.ok ? 'saved' : 'error');
        } catch {
          setSaveState('error');
        }
      }, SAVE_DELAY_MS);
    },
    [scope, user],
  );

  useEffect(() => {
    touchedRef.current = false;
    setFiltersState({ ...defaults(), ...readLocal(key) });
    setSaveState('idle');

    if (!user) {
      setResponsibleId(null);
      setReady(true);
      return undefined;
    }

    setReady(false);
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`/api/filter_preferences/${scope}/`, {
          headers: { Authorization: 'Bearer ' + String(tokenRef.current?.access) },
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        setResponsibleId(data.responsible_id);

        if (touchedRef.current) return;

        let next = null;
        if (data.filters) {
          next = { ...defaults(), ...data.filters };
        } else if (!readLocal(key) && data.responsible_id) {
          next = { ...defaults(), mine: true };
        }
        if (next) {
          setFiltersState(next);
          writeLocal(key, next);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
      } finally {
        if (!controller.signal.aborted) setReady(true);
      }
    })();

    return () => controller.abort();
    // The token is refreshed every few minutes; reloading preferences on each refresh is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scope, defaults]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const setFilters = useCallback(
    (update) => {
      touchedRef.current = true;
      const next = typeof update === 'function' ? update(filtersRef.current) : update;
      filtersRef.current = next;
      setFiltersState(next);
      writeLocal(key, next);
      saveToServer(next);
    },
    [key, saveToServer],
  );

  const resetFilters = useCallback(() => setFilters(defaults()), [defaults, setFilters]);

  return { filters, setFilters, resetFilters, ready, responsibleId, saveState };
};

export const filtersToQuery = (filters, entityKey) => {
  const params = new URLSearchParams();
  if (filters.responsible?.length) params.set('responsible', filters.responsible.join(','));
  if (filters[entityKey]?.length) params.set(entityKey, filters[entityKey].join(','));
  if (filters.mine) params.set('mine', '1');
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  return params.toString();
};

export default usePersistentFilters;
