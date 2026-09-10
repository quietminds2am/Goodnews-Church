import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { Admin, AdminRole } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { formatShortDate } from "../../lib/utils";

interface InviteForm {
  full_name: string;
  email: string;
  role: AdminRole;
}

function useAdmins() {
  return useQuery({
    queryKey: ["admin-admins"],
    queryFn: async (): Promise<Admin[]> => {
      const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Admin[];
    },
  });
}

export default function AdminsAdmin() {
  const { admin: currentAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdmins();
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<Admin | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({ defaultValues: { role: "editor" } });

  function openInvite() {
    reset({ full_name: "", email: "", role: "editor" });
    setInviteError(null);
    setModalOpen(true);
  }

  async function onInvite(values: InviteForm) {
    setInviteLoading(true);
    setInviteError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch("/api/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to invite admin");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite admin.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function changeRole(adminRow: Admin, role: AdminRole) {
    await supabase.from("admins").update({ role }).eq("id", adminRow.id);
    queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    try {
      const res = await fetch("/api/delete-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminId: removing.id }),
      });
      if (!res.ok) throw new Error("Failed to remove admin");
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
    } catch {
      // Surfaced implicitly by the dialog remaining open; kept simple by design.
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="Manage who can access this dashboard. Super Admins can manage other admins; Editors manage content only."
        action={
          <Button onClick={openInvite}>
            <Plus className="h-4 w-4" aria-hidden /> Invite Admin
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{a.full_name}</td>
                  <td className="px-4 py-3 text-ink-600">{a.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input !py-1.5 text-sm"
                      value={a.role}
                      disabled={a.id === currentAdmin?.id}
                      onChange={(e) => changeRole(a, e.target.value as AdminRole)}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatShortDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {a.id !== currentAdmin?.id && (
                        <button onClick={() => setRemoving(a)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Remove ${a.email}`}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invite Admin" size="sm">
        <form onSubmit={handleSubmit(onInvite)} noValidate className="space-y-5">
          <TextField label="Full name" required error={errors.full_name?.message} {...register("full_name", { required: "Full name is required" })} />
          <TextField label="Email address" type="email" required error={errors.email?.message} {...register("email", { required: "Email is required" })} />
          <div>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" className="input" {...register("role")}>
              <option value="editor">Editor — content only</option>
              <option value="super_admin">Super Admin — full access</option>
            </select>
          </div>
          <p className="flex items-start gap-2 text-sm text-ink-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            An email invitation will be sent with instructions to set a password.
          </p>
          {inviteError && <p role="alert" className="text-sm text-danger-700">{inviteError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={inviteLoading}>Send invite</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove admin"
        message={`Remove ${removing?.email} from the admin panel? They will immediately lose access.`}
        loading={removeLoading}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
