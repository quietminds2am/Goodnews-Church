import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Power } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { advertSchema, type AdvertInput } from "../../lib/validators";
import type { Advert } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";

function useAllAdverts() {
  return useQuery({
    queryKey: ["admin-adverts"],
    queryFn: async (): Promise<Advert[]> => {
      const { data, error } = await supabase.from("adverts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Advert[];
    },
  });
}

const PLACEMENT_LABEL: Record<Advert["placement"], string> = {
  home_top: "Homepage — Top Banner",
  home_middle: "Homepage — Middle Banner",
  events_sidebar: "Events Page",
  footer: "Footer",
};

export default function AdvertsAdmin() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAllAdverts();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Advert | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdvertInput>({ resolver: zodResolver(advertSchema) });

  function openCreate() {
    setImageUrl(null);
    setImageError(false);
    reset({ title: "", link_url: "", placement: "home_top", active: true, start_date: null, end_date: null });
    setSaveError(null);
    setModalOpen(true);
  }

  async function onSubmit(values: AdvertInput) {
    setSaveError(null);
    if (!imageUrl) {
      setImageError(true);
      return;
    }
    const { error } = await supabase.from("adverts").insert({
      title: values.title,
      image_url: imageUrl,
      link_url: values.link_url || null,
      placement: values.placement,
      active: values.active,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      created_by: admin?.id,
    });
    if (error) {
      setSaveError("Couldn't save this advert. Please try again.");
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
    queryClient.invalidateQueries({ queryKey: ["adverts"] });
  }

  async function toggleActive(advert: Advert) {
    await supabase.from("adverts").update({ active: !advert.active }).eq("id", advert.id);
    queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
    queryClient.invalidateQueries({ queryKey: ["adverts"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("adverts").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
      queryClient.invalidateQueries({ queryKey: ["adverts"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Adverts"
        description="Promotional banners shown in specific placements across the public site."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New Advert
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No adverts yet" action={<Button onClick={openCreate}>Create your first advert</Button>} />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((ad) => (
            <div key={ad.id} className="card overflow-hidden">
              <img src={ad.image_url} alt={ad.title} className="h-32 w-full object-cover" />
              <div className="p-4">
                <p className="font-semibold text-ink-900">{ad.title}</p>
                <p className="text-xs text-ink-400">{PLACEMENT_LABEL[ad.placement]}</p>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => toggleActive(ad)} className={`badge ${ad.active ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-500"}`}>
                    <Power className="h-3 w-3" aria-hidden />
                    {ad.active ? "Active" : "Paused"}
                  </button>
                  <button onClick={() => setDeleting(ad)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Delete ${ad.title}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Advert" size="md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <TextField label="Title" required error={errors.title?.message} {...register("title")} />
          <ImageUploadField
            label="Advert image"
            bucket="adverts"
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              setImageError(false);
            }}
            hint="Recommended: 16:9 image, under 5MB"
          />
          {imageError && <p role="alert" className="field-error">Please upload an advert image.</p>}
          <TextField label="Link URL" hint="Where the advert should link to (optional)" error={errors.link_url?.message} {...register("link_url")} />
          <div>
            <label className="label" htmlFor="placement">Placement</label>
            <select id="placement" className="input" {...register("placement")}>
              <option value="home_top">Homepage — Top Banner</option>
              <option value="home_middle">Homepage — Middle Banner</option>
              <option value="events_sidebar">Events Page</option>
              <option value="footer">Footer</option>
            </select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Start date" type="date" hint="Optional" {...register("start_date")} />
            <TextField label="End date" type="date" hint="Optional" {...register("end_date")} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="h-4 w-4 rounded border-ink-300" defaultChecked {...register("active")} />
            Active immediately
          </label>
          {saveError && <p role="alert" className="text-sm text-danger-700">{saveError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create advert</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete advert"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
