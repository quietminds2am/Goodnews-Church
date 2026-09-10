import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Seo } from "../../components/seo/Seo";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <Seo title="Unauthorized" path="/admin/unauthorized" noindex />
      <ShieldAlert className="h-12 w-12 text-danger-500" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">You don't have access to this page</h1>
      <p className="mt-2 max-w-sm text-ink-500">This section is restricted to Super Admins. Contact a Super Admin if you need access.</p>
      <Link to="/admin" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
