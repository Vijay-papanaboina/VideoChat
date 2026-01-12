import React from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorScreen = ({ message, onExit }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Access Denied
        </h2>
        <p className="text-muted-foreground mb-8">
          {message || "Unable to join this room."}
        </p>

        <Button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2"
          size="lg"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ErrorScreen;
