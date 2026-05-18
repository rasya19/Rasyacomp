import React, { createContext, useContext, useEffect, useState } from 'react';

const SubdomainContext = createContext<string | null>(null);

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Main domain identification based on user's rasyatech.rsch.my.id setup
    const isMain = parts[0] === 'rasyatech' || parts[0] === 'www' || parts.length < 3;

    if (!isMain) {
      setSubdomain(parts[0]);
    } else {
      setSubdomain(null); // Main domain behavior
    }
  }, []);

  return (
    <SubdomainContext.Provider value={subdomain}>
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
