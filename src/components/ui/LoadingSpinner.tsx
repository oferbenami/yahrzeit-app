export function LoadingSpinner({ size = "md", label = "טוען..." }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div role="status" aria-label={label} className="flex items-center justify-center gap-2">
      <div
        className={`${sizes[size]} rounded-full border-current border-t-transparent animate-spin text-primary`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
