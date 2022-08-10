import { useCallback, useState } from "react";
import axios from 'axios';

export function useLocalStorageState(key: string, defaultState?: string | object) {
  const [state, setState] = useState(() => {
    const storedState = localStorage.getItem(key);
    if (storedState) {
      return JSON.parse(storedState);
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState: any) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
}

export const getFastestEndpoint = async (endpoints: string[]) => {
  if (endpoints.length === 1 || !Promise.any) {
    return endpoints[0]
  }

  return await Promise.any(endpoints.map((endpoint) => axios.post(endpoint, { jsonrpc: '2.0', id: 1, method: 'getEpochInfo' }).then(() => endpoint)))
}