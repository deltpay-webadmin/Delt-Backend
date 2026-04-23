import React, { createContext, useContext } from 'react';

interface NavigationContextType {
  navigate: (page: string) => void;
  currentPage: string;
}

export const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  currentPage: '/',
});

export function useAppNavigate() {
  return useContext(NavigationContext);
}
