import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <span className="text-sm font-medium text-foreground">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
