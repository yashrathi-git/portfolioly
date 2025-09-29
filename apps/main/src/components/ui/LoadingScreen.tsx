interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted"></div>
          <div className="absolute top-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        {/* Message */}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
