import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { eventSchema, type EventInput } from "../../lib/validators";
import type { EventRow, SocialLink } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import { TextField, TextareaField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { slugify, formatShortDate } from "../../lib/utils";

function useAdminEvents() {
  return useQuery({
    queryKey: ["admin-events"],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
}

const PLATFORM_OPTIONS: SocialLink["platform"][] = ["instagram", "facebook", "youtube", "tiktok", "x", "whatsapp", "other"];

export default function EventsAdmin() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdminEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({ resolver: zodResolver(eventSchema) });

  const titleValue = watch("title");

  function openCreate() {
    setEditing(null);
    setFlyerUrl(null);
    setSocialLinks([]);
    setSlugTouched(false);
    reset({
      title: "",
      slug: "",
      description: "",
      category: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      status: "upcoming",
      flyer_alt: "",
    });
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(e: EventRow) {
    setEditing(e);
    setFlyerUrl(e.flyer_url);
    setSocialLinks(e.social_links ?? []);
    setSlugTouched(true);
    reset({
      title: e.title,
      slug: e.slug,
      description: e.description,
      category: e.category ?? "",
      event_date: e.event_date,
      start_time: e.start_time ?? "",
      end_time: e.end_time ?? "",
      location: e.location ?? "",
      status: e.status,
      flyer_alt: e.flyer_alt ?? "",
    });
    setSaveError(null);
    setModalOpen(true);
  }

  function handleTitleChange(value: string) {
    setValue("title", value);
    if (!slugTouched) setValue("slug", slugify(value));
  }

  function addSocialLink() {
    setSocialLinks((links) => [...links, { platform: "instagram", url: "", label: "" }]);
  }
  function updateSocialLink(index: number, patch: Partial<SocialLink>) {
    setSocialLinks((links) => links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function removeSocialLink(index: number) {
    setSocialLinks((links) => links.filter((_, i) => i !== index));
  }

  async function onSubmit(values: EventInput) {
    setSaveError(null);
    const payload = {
      title: values.title,
      slug: slugify(values.slug),
      description: values.description,
      category: values.category || null,
      event_date: values.event_date,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      location: values.location || null,
      status: values.status,
      flyer_url: flyerUrl,
      flyer_alt: values.flyer_alt || null,
      social_links: socialLinks.filter((l) => l.url.trim().length > 0),
    };

    const { error } = editing
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert({ ...payload, created_by: admin?.id });

    if (error) {
      setSaveError(error.code === "23505" ? "An event with this URL slug already exists — please choose another." : "Couldn't save this event. Please try again.");
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("events").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Events & Flyers"
        description="Create upcoming events with flyers, and archive past events with social media links."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New Event
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No events yet" action={<Button onClick={openCreate}>Create your first event</Button>} />
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{e.title}</td>
                  <td className="px-4 py-3 text-ink-500">{formatShortDate(e.event_date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        e.status === "upcoming"
                          ? "bg-success-50 text-success-700"
                          : e.status === "cancelled"
                          ? "bg-danger-50 text-danger-700"
                          : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="rounded p-1.5 text-ink-500 hover:bg-ink-100" aria-label={`Edit ${e.title}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button onClick={() => setDeleting(e)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Delete ${e.title}`}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Event" : "New Event"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Event title"
              required
              error={errors.title?.message}
              value={titleValue}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
            <TextField
              label="URL slug"
              required
              hint="Used in the event's public link"
              error={errors.slug?.message}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
          </div>

          <TextareaField label="Description" required rows={4} error={errors.description?.message} {...register("description")} />

          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="Category" hint="e.g. Youth Conference" error={errors.category?.message} {...register("category")} />
            <TextField label="Event date" type="date" required error={errors.event_date?.message} {...register("event_date")} />
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" className="input" {...register("status")}>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="Start time" type="time" error={errors.start_time?.message} {...register("start_time")} />
            <TextField label="End time" type="time" error={errors.end_time?.message} {...register("end_time")} />
            <TextField label="Location" error={errors.location?.message} {...register("location")} />
          </div>

          <ImageUploadField label="Event flyer" bucket="flyers" value={flyerUrl} onChange={setFlyerUrl} hint="Recommended: 4:3 image, under 5MB" />
          <TextField label="Flyer alt text" hint="Describe the flyer for screen readers and SEO" error={errors.flyer_alt?.message} {...register("flyer_alt")} />

          <div>
            <div className="flex items-center justify-between">
              <label className="label !mb-0">Social media links</label>
              <Button type="button" variant="ghost" onClick={addSocialLink}>
                <Plus className="h-4 w-4" aria-hidden /> Add link
              </Button>
            </div>
            <p className="mt-1 text-sm text-ink-400">
              For past events, link to Instagram/Facebook/YouTube posts so visitors can view photos and videos.
            </p>
            <div className="mt-3 space-y-3">
              {socialLinks.map((link, i) => (
                <div key={i} className="flex flex-col gap-2 rounded border border-ink-100 p-3 sm:flex-row sm:items-center">
                  <select
                    className="input sm:w-40"
                    value={link.platform}
                    onChange={(e) => updateSocialLink(i, { platform: e.target.value as SocialLink["platform"] })}
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input flex-1"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                  />
                  <input
                    className="input sm:w-40"
                    placeholder="Label (optional)"
                    value={link.label ?? ""}
                    onChange={(e) => updateSocialLink(i, { label: e.target.value })}
                  />
                  <button type="button" onClick={() => removeSocialLink(i)} aria-label="Remove link" className="rounded p-2 text-danger-500 hover:bg-danger-50">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {saveError && <p role="alert" className="text-sm text-danger-700">{saveError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Save changes" : "Create event"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete event"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
