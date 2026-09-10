import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { announcementSchema, type AnnouncementInput } from "../../lib/validators";
import type { Announcement } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { TextField, TextareaField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDate } from "../../lib/utils";

function useAdminAnnouncements() {
  return useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });
}

export default function AnnouncementsAdmin() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdminAnnouncements();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementInput>({ resolver: zodResolver(announcementSchema) });

  function openCreate() {
    setEditing(null);
    reset({ title: "", body: "", status: "draft", publish_at: null });
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    reset({ title: a.title, body: a.body, status: a.status, publish_at: a.publish_at });
    setSaveError(null);
    setModalOpen(true);
  }

  async function onSubmit(values: AnnouncementInput) {
    setSaveError(null);
    const payload = {
      title: values.title,
      body: values.body,
      status: values.status,
      publish_at: values.publish_at || (values.status === "published" ? new Date().toISOString() : null),
    };

    const { error } = editing
      ? await supabase.from("announcements").update(payload).eq("id", editing.id)
      : await supabase.from("announcements").insert({ ...payload, created_by: admin?.id });

    if (error) {
      setSaveError("Couldn't save this announcement. Please try again.");
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("announcements").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Publish updates that appear on the public Announcements page and homepage."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New Announcement
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No announcements yet" action={<Button onClick={openCreate}>Create your first announcement</Button>} />
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{a.title}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.status === "published" ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-600"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(a.publish_at ?? a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(a)} className="rounded p-1.5 text-ink-500 hover:bg-ink-100" aria-label={`Edit ${a.title}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button onClick={() => setDeleting(a)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Delete ${a.title}`}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Announcement" : "New Announcement"}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <TextField label="Title" required error={errors.title?.message} {...register("title")} />
          <TextareaField label="Body" required rows={6} error={errors.body?.message} {...register("body")} />
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" {...register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          {saveError && <p role="alert" className="text-sm text-danger-700">{saveError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Save changes" : "Publish"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete announcement"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
