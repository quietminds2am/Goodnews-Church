import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Download, Upload, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Member } from "../../types/database";
import { newsletterSchema, type NewsletterInput } from "../../lib/validators";
import { randomToken } from "../../lib/utils";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { ImportMembersModal } from "../../components/admin/ImportMembersModal";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { formatShortDate } from "../../lib/utils";

function useAdminMembers() {
  return useQuery({
    queryKey: ["admin-members"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.from("members").select("*").order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });
}

function toCsv(members: Member[]): string {
  const header = ["Full Name", "Email", "Phone", "Date of Birth", "Gender", "Department", "Subscribed", "Source", "Joined"];
  const rows = members.map((m) => [
    m.full_name ?? "",
    m.email,
    m.phone ?? "",
    m.date_of_birth ?? "",
    m.gender ?? "",
    m.department ?? "",
    m.subscribed ? "Yes" : "No",
    m.source ?? "",
    new Date(m.joined_at).toLocaleDateString("en-NG"),
  ]);
  return [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function MembersAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdminMembers();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Not part of newsletterSchema (that's shared with the public subscribe
  // form, which never collects these) — plain controlled fields instead,
  // same pattern as ImageUploadField's value elsewhere in admin forms.
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [department, setDepartment] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) => m.full_name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone?.toLowerCase().includes(q)
    );
  }, [data, search]);

  function openCreate() {
    reset({ full_name: "", email: "", phone: "" });
    setDateOfBirth("");
    setGender("");
    setDepartment("");
    setSaveError(null);
    setModalOpen(true);
  }

  async function onSubmit(values: NewsletterInput) {
    setSaveError(null);
    const { error } = await supabase.from("members").insert({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      department: department || null,
      subscribed: true,
      source: "admin_added",
      unsubscribe_token: randomToken(),
    });
    if (error) {
      setSaveError(error.code === "23505" ? "A member with this email already exists." : "Couldn't add this member. Please try again.");
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-members"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("members").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    }
  }

  function exportCsv() {
    if (!data) return;
    const csv = toCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone who has subscribed for email updates, plus members added manually."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden /> Import CSV
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={!data || data.length === 0}>
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden /> Add Member
            </Button>
          </div>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search members"
          />
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState title={search ? "No members match your search" : "No members yet"} action={!search ? <Button onClick={openCreate}>Add your first member</Button> : undefined} />
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Gender</th>
                <th className="px-4 py-3 font-medium">Date of Birth</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{m.full_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{m.email}</td>
                  <td className="px-4 py-3 text-ink-500">{m.phone || "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{m.department || "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{m.gender || "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{m.date_of_birth ? formatShortDate(m.date_of_birth) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${m.subscribed ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-600"}`}>
                      {m.subscribed ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatShortDate(m.joined_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => setDeleting(m)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Remove ${m.email}`}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Member" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <TextField label="Full name" required error={errors.full_name?.message} {...register("full_name")} />
          <TextField label="Email address" type="email" required error={errors.email?.message} {...register("email")} />
          <TextField label="Phone number" hint="Optional" error={errors.phone?.message} {...register("phone")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="member-dob">Date of birth</label>
              <input id="member-dob" type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="member-gender">Gender</label>
              <input id="member-gender" type="text" className="input" placeholder="Optional" value={gender} onChange={(e) => setGender(e.target.value)} />
            </div>
          </div>
          <TextField label="Department" hint="Optional — e.g. Choir, Media, Ushering" value={department} onChange={(e) => setDepartment(e.target.value)} />
          {saveError && <p role="alert" className="text-sm text-danger-700">{saveError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Add member</Button>
          </div>
        </form>
      </Modal>

      <ImportMembersModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ["admin-members"] })}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove member"
        message={`Remove ${deleting?.email} from your members list? They will stop receiving emails.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
