import { useEffect, useCallback, useRef } from 'react';
import { useWakeUpContext } from '@/contexts/useWakeUpContext';
import { wakeUpMessages } from '@/lib/wakeUpMessages';
import { checkBackendHealth } from '@/lib/strapi';

export function useWakeUpStatus() {
  const { state, startWakeUp, completeWakeUp, setUsingMockData, rotateMessage } = useWakeUpContext();
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loggedProgressRef = useRef<Set<number>>(new Set()); // Track logged progress
  const hasStartedCountdownRef = useRef(false);

  // Message rotation effect
  useEffect(() => {
    if (state.isWakingUp) {
      let index = state.messageIndex;
      
      // Set initial message
      if (!state.currentMessage) {
        const message = wakeUpMessages[index % wakeUpMessages.length];
        rotateMessage(message, index);
        index++;
      }

      // Rotate messages every 5 seconds
      messageIntervalRef.current = setInterval(() => {
        const message = wakeUpMessages[index % wakeUpMessages.length];
        rotateMessage(message, index);
        index++;
      }, 5000);
    } else {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
    }

    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, [state.isWakingUp, state.messageIndex, state.currentMessage, rotateMessage]);

  // Countdown timer effect
  useEffect(() => {
    if (state.isWakingUp && state.wakeUpStartTime) {
      if (!hasStartedCountdownRef.current) {
        console.log('⏰ Starting 60-second countdown timer...');
        hasStartedCountdownRef.current = true;
      }
      
      countdownIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - state.wakeUpStartTime!) / 1000);
        const remaining = Math.max(0, 60 - elapsed);

        // Log countdown progress at key intervals (only once each)
        if (remaining === 30 && !loggedProgressRef.current.has(30)) {
          console.log('⏰ Wake-up progress: 30 seconds remaining...');
          loggedProgressRef.current.add(30);
        } else if (remaining === 10 && !loggedProgressRef.current.has(10)) {
          console.log('⏰ Wake-up progress: 10 seconds remaining...');
          loggedProgressRef.current.add(10);
        } else if (remaining === 5 && !loggedProgressRef.current.has(5)) {
          console.log('⏰ Wake-up progress: 5 seconds remaining...');
          loggedProgressRef.current.add(5);
        } else if (remaining === 0 && !loggedProgressRef.current.has(0)) {
          console.log('🎊 Wake-up countdown complete! Refreshing page...');
          loggedProgressRef.current.add(0);
        }

        if (remaining <= 0) {
          // Wake up complete - refresh page
          completeWakeUp();
          console.log('🔄 Page refresh triggered to load real data');
          window.location.reload();
        } else {
          // Update countdown using context action
          setUsingMockData(true);
        }
      }, 100); // Update every 100ms for smooth countdown
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      // Reset refs when wake-up completes
      if (!state.isWakingUp) {
        hasStartedCountdownRef.current = false;
        loggedProgressRef.current = new Set();
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [state.isWakingUp, state.wakeUpStartTime, completeWakeUp, setUsingMockData]);

  // Initial health check and wake-up detection
  const checkWakeUpStatus = useCallback(async () => {
    try {
      // Clear any existing timeout
      if (healthCheckTimeoutRef.current) {
        clearTimeout(healthCheckTimeoutRef.current);
      }

      const isHealthy = await checkBackendHealth();
      
      if (!isHealthy && !state.isWakingUp) {
        console.log('😴 Backend is sleeping - Starting wake-up process...');
        // Backend is sleeping, start wake-up process
        startWakeUp();
        
        // Trigger a request to wake up the backend
        try {
          console.log('📡 Sending wake-up request to backend...');
          await fetch(`${import.meta.env.VITE_STRAPI_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // 5 second timeout for wake-up trigger
          });
        } catch (error) {
          // Expected - server is still waking up
          if (error instanceof Error) {
            console.log('🌅 Wake-up request sent, server is starting up (expected error):', error.message);
          } else {
            console.log('🌅 Wake-up request sent, server is starting up (expected error):', error);
          }
        }
      } else if (isHealthy && state.isWakingUp) {
        console.log('🎉 Backend woke up successfully! Completing wake-up process...');
        // Backend woke up earlier than expected
        completeWakeUp();
      }
    } catch (error) {
      console.error('💥 Wake-up Status Check failed:', error);
      if (!state.isWakingUp) {
        console.log('🚨 Starting wake-up due to health check failure...');
        startWakeUp();
      }
    }
  }, [state.isWakingUp, startWakeUp, completeWakeUp]);

  // Auto-check health status when not waking up
  useEffect(() => {
    if (!state.isWakingUp) {
      // Initial check after component mount
      healthCheckTimeoutRef.current = setTimeout(() => {
        checkWakeUpStatus();
      }, 1000);

      return () => {
        if (healthCheckTimeoutRef.current) {
          clearTimeout(healthCheckTimeoutRef.current);
        }
      };
    }
  }, [state.isWakingUp, checkWakeUpStatus]);

  // Calculate current countdown seconds
  const getCurrentCountdown = useCallback(() => {
    if (!state.isWakingUp || !state.wakeUpStartTime) {
      return 60;
    }
    
    const now = Date.now();
    const elapsed = Math.floor((now - state.wakeUpStartTime) / 1000);
    return Math.max(0, 60 - elapsed);
  }, [state.isWakingUp, state.wakeUpStartTime]);

  // Format countdown as MM:SS
  const formatCountdown = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isWakingUp: state.isWakingUp,
    isUsingMockData: state.isUsingMockData,
    currentMessage: state.currentMessage,
    countdownSeconds: getCurrentCountdown(),
    formattedCountdown: formatCountdown(getCurrentCountdown()),
    checkWakeUpStatus,
  };
}