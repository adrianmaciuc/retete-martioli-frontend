import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface WakeUpState {
  isWakingUp: boolean;
  countdownSeconds: number;
  isUsingMockData: boolean;
  wakeUpStartTime: number | null;
  currentMessage: string;
  messageIndex: number;
}

type WakeUpAction =
  | { type: 'START_WAKE_UP'; startTime: number }
  | { type: 'UPDATE_COUNTDOWN'; seconds: number }
  | { type: 'WAKE_UP_COMPLETE' }
  | { type: 'SET_MOCK_DATA'; usingMockData: boolean }
  | { type: 'ROTATE_MESSAGE'; message: string; index: number }
  | { type: 'RESET' };

const WakeUpContext = createContext<WakeUpContextType | undefined>(undefined);

const initialState: WakeUpState = {
  isWakingUp: false,
  countdownSeconds: 60,
  isUsingMockData: false,
  wakeUpStartTime: null,
  currentMessage: '',
  messageIndex: 0,
};

function wakeUpReducer(state: WakeUpState, action: WakeUpAction): WakeUpState {
  switch (action.type) {
    case 'START_WAKE_UP':
      return {
        ...state,
        isWakingUp: true,
        countdownSeconds: 60,
        wakeUpStartTime: action.startTime,
        isUsingMockData: true,
      };
    case 'UPDATE_COUNTDOWN':
      return {
        ...state,
        countdownSeconds: action.seconds,
      };
    case 'WAKE_UP_COMPLETE':
      return {
        ...state,
        isWakingUp: false,
        countdownSeconds: 60,
        isUsingMockData: false,
        wakeUpStartTime: null,
      };
    case 'SET_MOCK_DATA':
      return {
        ...state,
        isUsingMockData: action.usingMockData,
      };
    case 'ROTATE_MESSAGE':
      return {
        ...state,
        currentMessage: action.message,
        messageIndex: action.index,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}



interface WakeUpContextType {
  state: WakeUpState;
  startWakeUp: () => void;
  completeWakeUp: () => void;
  setUsingMockData: (usingMockData: boolean) => void;
  rotateMessage: (message: string, index: number) => void;
}

interface WakeUpProviderProps {
  children: ReactNode;
}

export function WakeUpProvider({ children }: WakeUpProviderProps) {
  const [state, dispatch] = useReducer(wakeUpReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('backend-wake-up');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // If wake-up was started less than 60 seconds ago, restore it
        if (parsed.isWakingUp && parsed.wakeUpStartTime) {
          const elapsed = Math.floor((now - parsed.wakeUpStartTime) / 1000);
          const remaining = Math.max(0, 60 - elapsed);
          
          if (remaining > 0) {
            dispatch({ type: 'START_WAKE_UP', startTime: parsed.wakeUpStartTime });
            dispatch({ type: 'UPDATE_COUNTDOWN', seconds: remaining });
            dispatch({ type: 'SET_MOCK_DATA', usingMockData: true });
          } else {
            // Wake-up period expired, reset
            dispatch({ type: 'RESET' });
            localStorage.removeItem('backend-wake-up');
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load wake-up state from localStorage:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (state.isWakingUp) {
      try {
        localStorage.setItem('backend-wake-up', JSON.stringify({
          isWakingUp: state.isWakingUp,
          wakeUpStartTime: state.wakeUpStartTime,
        }));
      } catch (error) {
        console.warn('Failed to save wake-up state to localStorage:', error);
      }
    } else {
      localStorage.removeItem('backend-wake-up');
    }
  }, [state.isWakingUp, state.wakeUpStartTime]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'backend-wake-up') {
        if (e.newValue) {
          const parsed = JSON.parse(e.newValue);
          const now = Date.now();
          
          if (parsed.isWakingUp && parsed.wakeUpStartTime) {
            const elapsed = Math.floor((now - parsed.wakeUpStartTime) / 1000);
            const remaining = Math.max(0, 60 - elapsed);
            
            if (remaining > 0) {
              dispatch({ type: 'START_WAKE_UP', startTime: parsed.wakeUpStartTime });
              dispatch({ type: 'UPDATE_COUNTDOWN', seconds: remaining });
              dispatch({ type: 'SET_MOCK_DATA', usingMockData: true });
            } else {
              dispatch({ type: 'RESET' });
            }
          }
        } else {
          dispatch({ type: 'RESET' });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const startWakeUp = () => {
    const startTime = Date.now();
    dispatch({ type: 'START_WAKE_UP', startTime });
  };

  const completeWakeUp = () => {
    dispatch({ type: 'WAKE_UP_COMPLETE' });
  };

  const setUsingMockData = (usingMockData: boolean) => {
    dispatch({ type: 'SET_MOCK_DATA', usingMockData });
  };

  const rotateMessage = (message: string, index: number) => {
    dispatch({ type: 'ROTATE_MESSAGE', message, index });
  };

  const value: WakeUpContextType = {
    state,
    startWakeUp,
    completeWakeUp,
    setUsingMockData,
    rotateMessage,
  };

  return (
    <WakeUpContext.Provider value={value}>
      {children}
    </WakeUpContext.Provider>
  );
}

export { WakeUpContext };
export type { WakeUpContextType };



