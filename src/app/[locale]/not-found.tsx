import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4" dir="rtl">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4" aria-hidden="true">
          404
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">הדף לא נמצא</h1>
        <p className="text-muted-foreground mb-6">
          הדף שחיפשת אינו קיים או הוסר.
        </p>
        <Link
          href="/he"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          חזור לדף הבית
        </Link>
      </div>
    </div>
  );
}
