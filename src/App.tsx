import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/layout/Layout";
import { LoadingState } from "./components/ui/States";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PageTransition } from "./components/motion/PageTransition";

// Public pages
const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const Programs = lazy(() => import("./pages/public/Programs"));
const Events = lazy(() => import("./pages/public/Events"));
const EventDetail = lazy(() => import("./pages/public/EventDetail"));
const PastEvents = lazy(() => import("./pages/public/PastEvents"));
const Announcements = lazy(() => import("./pages/public/Announcements"));
const Contact = lazy(() => import("./pages/public/Contact"));
const FAQ = lazy(() => import("./pages/public/FAQ"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AnnouncementsAdmin = lazy(() => import("./pages/admin/AnnouncementsAdmin"));
const EventsAdmin = lazy(() => import("./pages/admin/EventsAdmin"));
const MembersAdmin = lazy(() => import("./pages/admin/MembersAdmin"));
const CampaignsAdmin = lazy(() => import("./pages/admin/CampaignsAdmin"));
const BrandAssetsAdmin = lazy(() => import("./pages/admin/BrandAssetsAdmin"));
const AdvertsAdmin = lazy(() => import("./pages/admin/AdvertsAdmin"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));
const AdminsAdmin = lazy(() => import("./pages/admin/AdminsAdmin"));
const Unauthorized = lazy(() => import("./pages/admin/Unauthorized"));

function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <PageTransition>
        <Suspense fallback={<LoadingState />}>{children}</Suspense>
      </PageTransition>
    </Layout>
  );
}

// Public routes get a cross-fade between pages: keying `<Routes>` by pathname
// (inside `AnimatePresence`) lets the outgoing page's `PageTransition` play
// its exit animation before the next page mounts. Scoped to its own
// `<Routes>` so it never touches `/admin/*` — that tree stays nested under
// one stable `AdminLayout` and must NOT remount on every internal nav.
function PublicRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicPage><Home /></PublicPage>} />
        <Route path="/about" element={<PublicPage><About /></PublicPage>} />
        <Route path="/programs" element={<PublicPage><Programs /></PublicPage>} />
        <Route path="/events" element={<PublicPage><Events /></PublicPage>} />
        <Route path="/events/:slug" element={<PublicPage><EventDetail /></PublicPage>} />
        <Route path="/past-events" element={<PublicPage><PastEvents /></PublicPage>} />
        <Route path="/announcements" element={<PublicPage><Announcements /></PublicPage>} />
        <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
        <Route path="/faq" element={<PublicPage><FAQ /></PublicPage>} />
        <Route path="/privacy-policy" element={<PublicPage><Privacy /></PublicPage>} />
        <Route path="/terms" element={<PublicPage><Terms /></PublicPage>} />
        <Route path="*" element={<PublicPage><NotFound /></PublicPage>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Admin — unanimated, nested under one persistent AdminLayout */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<LoadingState />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin/unauthorized"
          element={
            <Suspense fallback={<LoadingState />}>
              <Unauthorized />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingState />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="announcements" element={<AnnouncementsAdmin />} />
          <Route path="events" element={<EventsAdmin />} />
          <Route path="members" element={<MembersAdmin />} />
          <Route path="campaigns" element={<CampaignsAdmin />} />
          <Route path="brand-assets" element={<BrandAssetsAdmin />} />
          <Route path="adverts" element={<AdvertsAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="admins" element={<ProtectedRoute requireRole="super_admin"><AdminsAdmin /></ProtectedRoute>} />
        </Route>

        {/* Public site */}
        <Route path="/*" element={<PublicRoutes />} />
      </Routes>
    </ErrorBoundary>
  );
}
