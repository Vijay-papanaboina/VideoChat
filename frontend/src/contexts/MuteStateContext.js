import { createContext, useContext } from "react";

// Create context for mute state
export const MuteStateContext = createContext();

// Hook to use mute state
export const useMuteState = () => {
  const context = useContext(MuteStateContext);
  if (!context) {
    throw new Error("useMuteState must be used within a MuteStateProvider");
  }
  return context;
};
