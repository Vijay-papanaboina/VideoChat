import React from "react";

const LoadingScreen = ({ text = "Joining Room..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <h2 className="text-xl font-semibold">{text}</h2>
      <p className="text-muted-foreground mt-2">
        Please wait while we connect you.
      </p>
    </div>
  );
};

export default LoadingScreen;
