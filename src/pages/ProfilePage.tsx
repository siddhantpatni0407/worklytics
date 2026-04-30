import { useState, useEffect } from "react";
import { User, Mail, Briefcase, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore, computeInitials } from "@/store/appStore";
import { setSettingsBatch } from "@/utils/tauriCommands";
import { cn } from "@/utils/cn";

function Field({
  icon, label, description, children,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 px-5 border-b border-[var(--border-card)] last:border-0">
      <div className="flex items-center gap-2 sm:w-44 flex-shrink-0 pt-0.5">
        <span className="text-brand-500">{icon}</span>
        <div>
          <p className="text-sm font-medium text-app-primary">{label}</p>
          {description && <p className="text-[11px] text-app-muted leading-relaxed mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile } = useAppStore();
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [saving, setSaving] = useState(false);

  // Sync form from store whenever profile changes (e.g. initial load from DB)
  useEffect(() => {
    setForm({ name: profile.name, email: profile.email, role: profile.role });
  }, [profile.name, profile.email, profile.role]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await setSettingsBatch([
        ["profile_name",  form.name.trim()],
        ["profile_email", form.email.trim()],
        ["profile_role",  form.role.trim()],
      ]);
      updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        avatarInitials: computeInitials(form.name.trim()),
      });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = computeInitials(form.name || "?");
  const hasChanges =
    form.name.trim()  !== profile.name  ||
    form.email.trim() !== profile.email ||
    form.role.trim()  !== profile.role;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Profile</h2>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all",
            "bg-brand-600 hover:bg-brand-700",
            (saving || !hasChanges) && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {/* ── Avatar + name hero ────────────────────────────────────────────── */}
      <div className="wl-card overflow-hidden">
        <div className="px-6 py-6 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-transparent border-b border-[var(--border-card)] flex items-center gap-5">
          {/* Avatar circle */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/25 flex-shrink-0 select-none">
            <span className="text-2xl font-extrabold text-white tracking-tight">{initials}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-app-primary leading-tight truncate">
              {form.name.trim() || "Your Name"}
            </h3>
            {form.role.trim() && (
              <p className="text-sm text-brand-500 font-medium mt-0.5 truncate">{form.role.trim()}</p>
            )}
            {form.email.trim() && (
              <p className="text-xs text-app-muted mt-1 truncate">{form.email.trim()}</p>
            )}
          </div>
        </div>

        {/* ── Fields ──────────────────────────────────────────────────────── */}
        <Field
          icon={<User className="h-4 w-4" />}
          label="Display Name"
          description="Shown in greetings and the sidebar"
        >
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Siddhant Patni"
            maxLength={80}
            className="wl-input"
          />
        </Field>

        <Field
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          description="Optional — for display only, never sent anywhere"
        >
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="e.g. user@example.com"
            maxLength={120}
            className="wl-input"
          />
        </Field>

        <Field
          icon={<Briefcase className="h-4 w-4" />}
          label="Role / Designation"
          description="Optional — shown below your name"
        >
          <input
            type="text"
            value={form.role}
            onChange={set("role")}
            placeholder="e.g. Senior Software Engineer"
            maxLength={100}
            className="wl-input"
          />
        </Field>
      </div>

      {/* ── Info note ────────────────────────────────────────────────────── */}
      <div className="wl-card px-5 py-3.5 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-app-secondary leading-relaxed">
          Profile data is stored locally in your SQLite database. It is never sent to any external service.
          Changes are reflected immediately in the sidebar and Home page greeting.
        </p>
      </div>
    </div>
  );
}
