import { useContext } from "react";
import { MuteStateContext } from "../contexts/MuteStateContext";

// Hook to use mute state
export const useMuteState = () => {
  const context = useContext(MuteStateContext);
  if (!context) {
    throw new Error("useMuteState must be used within a MuteStateProvider");
  }
  return context;
};
