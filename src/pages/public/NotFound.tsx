import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Seo } from "../../components/seo/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" path="/404" noindex />
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">404 Error</p>
        <h1 className="mt-3 text-4xl font-semibold">We can't find that page</h1>
        <p className="mt-3 max-w-md text-ink-500">
          The page you're looking for may have moved or no longer exists. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn-primary">
            <Home className="h-4 w-4" aria-hidden />
            Back to Home
          </Link>
          <Link to="/events" className="btn-outline">
            <Search className="h-4 w-4" aria-hidden />
            Browse Events
          </Link>
        </div>
      </div>
    </>
  );
}
