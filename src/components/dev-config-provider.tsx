'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import DevConfigModal from './dev-config-modal';

interface DevConfigContextType {
  openConfigModal: () => void;
}

const DevConfigContext = createContext<DevConfigContextType | undefined>(undefined);

export function useDevConfig() {
  const context = useContext(DevConfigContext);
  if (!context) {
    throw new Error('useDevConfig must be used within a DevConfigProvider');
  }
  return context;
}

export default function DevConfigProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // This now only runs on the client
    const configMarker = sessionStorage.getItem('dev-config-set');
    if (configMarker !== 'true') {
      setIsModalOpen(true);
    }
  }, []);

  const openConfigModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleConfigSet = () => {
    sessionStorage.setItem('dev-config-set', 'true');
    setIsModalOpen(false);
    window.location.reload();
  };
  
  const handleCloseModal = () => {
    // If user closes modal manually, assume they are okay with current config for the session
    if(!sessionStorage.getItem('dev-config-set')) {
        sessionStorage.setItem('dev-config-set', 'true');
    }
    setIsModalOpen(false);
  }

  return (
    <DevConfigContext.Provider value={{ openConfigModal }}>
      {children}
      {isModalOpen && <DevConfigModal onConfigSet={handleConfigSet} onClose={handleCloseModal} />}
    </DevConfigContext.Provider>
  );
}
