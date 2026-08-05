import React, { createContext, useContext, useState, useCallback } from "react";
import { invalidateCache as clearCache } from "../utils/cache";

interface CacheContextType {
  version: number;
  invalidate: (keyPattern?: string) => void;
}

const CacheContext = createContext<CacheContextType>({
  version: 0,
  invalidate: () => {},
});

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);

  const invalidate = useCallback((keyPattern?: string) => {
    clearCache(keyPattern);
    setVersion((v) => v + 1);
  }, []);

  return (
    <CacheContext.Provider value={{ version, invalidate }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCacheInvalidation() {
  return useContext(CacheContext);
}
