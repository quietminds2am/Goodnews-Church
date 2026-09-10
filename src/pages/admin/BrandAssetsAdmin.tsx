import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Power } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { BrandAsset, BrandAssetType } from "../../types/database";
import { PageHeader } from "../../components/admin/PageHeader";
import { Modal } from "../../components/admin/Modal";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { ImageUploadField } from "../../components/admin/ImageUploadField";
import { TextField } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";

function useAllBrandAssets() {
  return useQuery({
    queryKey: ["admin-brand-assets"],
    queryFn: async (): Promise<BrandAsset[]> => {
      const { data, error } = await supabase.from("brand_assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandAsset[];
    },
  });
}

const TYPE_LABEL: Record<BrandAssetType, string> = {
  church_logo: "Church Logo",
  member_logo: "Member / Media Brand",
  partner_logo: "Partner Organization",
};

export default function BrandAssetsAdmin() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAllBrandAssets();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<BrandAsset | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<BrandAssetType>("member_logo");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setName("");
    setType("member_logo");
    setImageUrl(null);
    setSaveError(false);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim() || !imageUrl) {
      setSaveError(true);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("brand_assets").insert({
      name: name.trim(),
      type,
      image_url: imageUrl,
      active: true,
      uploaded_by: admin?.id,
    });
    setSaving(false);
    if (error) {
      setSaveError(true);
      return;
    }
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-brand-assets"] });
    queryClient.invalidateQueries({ queryKey: ["brand_assets"] });
  }

  async function toggleActive(asset: BrandAsset) {
    await supabase.from("brand_assets").update({ active: !asset.active }).eq("id", asset.id);
    queryClient.invalidateQueries({ queryKey: ["admin-brand-assets"] });
    queryClient.invalidateQueries({ queryKey: ["brand_assets"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("brand_assets").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (!error) {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin-brand-assets"] });
      queryClient.invalidateQueries({ queryKey: ["brand_assets"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Brand Assets"
        description="Manage the church logo, and member or ministry-partner brand logos shown across the site."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden /> Upload Logo
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No brand assets uploaded yet" message="The site is currently showing default sample logos." action={<Button onClick={openCreate}>Upload your first logo</Button>} />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((asset) => (
            <div key={asset.id} className="card p-5">
              <div className="flex h-24 items-center justify-center rounded bg-ink-50 p-3">
                <img src={asset.image_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
              </div>
              <p className="mt-3 font-semibold text-ink-900">{asset.name}</p>
              <p className="text-xs text-ink-400">{TYPE_LABEL[asset.type]}</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => toggleActive(asset)}
                  className={`badge ${asset.active ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-500"}`}
                >
                  <Power className="h-3 w-3" aria-hidden />
                  {asset.active ? "Active" : "Hidden"}
                </button>
                <button onClick={() => setDeleting(asset)} className="rounded p-1.5 text-danger-500 hover:bg-danger-50" aria-label={`Delete ${asset.name}`}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Brand Logo" size="sm">
        <div className="space-y-5">
          <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goodnews Creative Media" />
          <div>
            <label className="label" htmlFor="asset-type">Type</label>
            <select id="asset-type" className="input" value={type} onChange={(e) => setType(e.target.value as BrandAssetType)}>
              <option value="church_logo">Church Logo</option>
              <option value="member_logo">Member / Media Brand</option>
              <option value="partner_logo">Partner Organization</option>
            </select>
          </div>
          <ImageUploadField label="Logo image" bucket="brand-assets" value={imageUrl} onChange={setImageUrl} />
          {saveError && <p role="alert" className="text-sm text-danger-700">Please provide a name and upload an image.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save logo</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete brand asset"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
