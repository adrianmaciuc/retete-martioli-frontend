import { useContext } from 'react';
import { WakeUpContext, WakeUpContextType } from './WakeUpContext';

export function useWakeUpContext(): WakeUpContextType {
  const context = useContext(WakeUpContext);
  if (context === undefined) {
    throw new Error('useWakeUpContext must be used within a WakeUpProvider');
  }
  return context;
}