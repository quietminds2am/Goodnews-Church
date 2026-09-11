import { Megaphone } from "lucide-react";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { Seo } from "../../components/seo/Seo";
import { formatDate } from "../../lib/utils";
import { Reveal } from "../../components/motion/Reveal";
import { Hero3DBackground } from "../../components/motion/Hero3DBackground";
import { StaggerGroup, StaggerItem } from "../../components/motion/StaggerGroup";
import { Tilt } from "../../components/motion/Tilt";

export default function Announcements() {
  const { data, isLoading, isError, refetch } = useAnnouncements();

  return (
    <>
      <Seo
        title="Announcements"
        path="/announcements"
        description="Official announcements from RCCG Goodnews Area Youth Church HQ."
      />

      <section className="relative overflow-hidden py-16 text-white sm:py-20">
        <Hero3DBackground />
        <Reveal className="container-page relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Church News</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Announcements</h1>
        </Reveal>
      </section>

      <div className="container-page max-w-3xl py-16">
        {isLoading && <LoadingState label="Loading announcements…" />}
        {isError && <ErrorState message="Couldn't load announcements right now." onRetry={() => refetch()} />}
        {!isLoading && !isError && data && data.length === 0 && (
          <EmptyState title="No announcements yet" message="Check back soon for updates from the church." />
        )}
        {data && data.length > 0 && (
          <StaggerGroup as="ul" className="space-y-6">
            {data.map((a) => (
              <StaggerItem as="li" key={a.id}>
                <Tilt className="card p-6" strength={4}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Megaphone className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-semibold">{a.title}</h2>
                      <p className="mt-1 text-xs font-medium text-ink-400">{formatDate(a.publish_at ?? a.created_at)}</p>
                      <p className="mt-3 whitespace-pre-line text-ink-600">{a.body}</p>
                    </div>
                  </div>
                </Tilt>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </>
  );
}
