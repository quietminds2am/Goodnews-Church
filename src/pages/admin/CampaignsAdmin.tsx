import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { campaignSchema, type CampaignInput } from "../../lib/validators";
import type { EmailCampaign } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { TextField, TextareaField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDate } from "../../lib/utils";

function useAdminCampaigns() {
  return useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async (): Promise<EmailCampaign[]> => {
      const { data, error } = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EmailCampaign[];
    },
  });
}

const STATUS_STYLE: Record<EmailCampaign["status"], string> = {
  draft: "bg-ink-100 text-ink-600",
  scheduled: "bg-warning-50 text-warning-700",
  sending: "bg-brand-50 text-brand-700",
  sent: "bg-success-50 text-success-700",
  failed: "bg-danger-50 text-danger-700",
};

export default function CampaignsAdmin() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdminCampaigns();
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState<EmailCampaign | null>(null);
  const [deleting, setDeleting] = useState<EmailCampaign | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignInput>({ resolver: zodResolver(campaignSchema) });

  function openCreate() {
    reset({ subject: "", body_html: "", campaign_type: "general", scheduled_at: null, related_event_id: null });
    setSaveError(null);
    setModalOpen(true);
  }

  async function onSubmit(values: CampaignInput) {
    setSaveError(null);
    const { error } = await supabase.from("email_campaigns").insert({
      subject: values.subject,
      body_html: values.body_html,
      campaign_type: values.campaign_type,
      status: values.scheduled_at ? "scheduled" : "draft",
      scheduled_at: values.scheduled_at || null,
      created_by: admin?.id,
      recipient_count: 0,
    });
    if (error) {
      setSaveError("Couldn't save this campaign. Please try again.");
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
  }

  async function confirmSend() {
    if (!sending) return;
    setSendLoading(true);
    setSendError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campaignId: sending.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to send campaign");
      setSending(null);
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send campaign. Please try again.");
    } finally {
      setSendLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("email_campaigns").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Email Campaigns"
        description="Send announcements, service reminders, and event reminders to subscribed members via email."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> New Campaign
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No campaigns yet" action={<Button onClick={openCreate}>Create your first campaign</Button>} />
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent from</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{c.subject}</td>
                  <td className="px-4 py-3 capitalize text-ink-500">{c.campaign_type.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{c.sender_email || "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{c.recipient_count || "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{c.sent_at ? formatDate(c.sent_at) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {(c.status === "draft" || c.status === "failed") && (
                        <button onClick={() => setSending(c)} className="rounded p-1.5 text-brand-600 hover:bg-brand-50" aria-label={`Send ${c.subject}`}>
                          <Send className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      {c.status !== "sent" && c.status !== "sending" && (
                        <button onClick={() => setDeleting(c)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Delete ${c.subject}`}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Email Campaign" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <TextField label="Subject line" required error={errors.subject?.message} {...register("subject")} />
          <div>
            <label className="label" htmlFor="campaign_type">Campaign type</label>
            <select id="campaign_type" className="input" {...register("campaign_type")}>
              <option value="general">General update</option>
              <option value="announcement">Announcement</option>
              <option value="event_reminder">Event reminder</option>
              <option value="service_reminder">Service reminder</option>
            </select>
          </div>
          <TextareaField
            label="Message (HTML supported)"
            required
            rows={10}
            hint="Basic HTML tags like <p>, <strong>, <a href> are supported."
            error={errors.body_html?.message}
            {...register("body_html")}
          />
          <TextField
            label="Schedule for later"
            type="datetime-local"
            hint="Leave blank to save as a draft you can send manually"
            {...register("scheduled_at")}
          />
          {saveError && <p role="alert" className="text-sm text-danger-700">{saveError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save campaign</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(sending)} onClose={() => setSending(null)} title="Send Campaign" size="sm">
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-ink-600">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            This will immediately email every subscribed member. This cannot be undone.
          </p>
          {sendError && <p role="alert" className="text-sm text-danger-700">{sendError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSending(null)}>Cancel</Button>
            <Button onClick={confirmSend} loading={sendLoading}>
              <Send className="h-4 w-4" aria-hidden /> Send now
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete campaign"
        message={`Delete the campaign "${deleting?.subject}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
