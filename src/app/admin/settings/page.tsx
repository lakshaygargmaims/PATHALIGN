'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';

interface Setting {
  key: string;
  value: unknown;
  description: string;
  isDefault: boolean;
}

interface SettingsResponse {
  settings: Setting[];
  ai: { provider: string; model: string; mode: string; ragMode: string };
}

export default function AdminSettings() {
  const { data, loading, error, refetch } = useApi<SettingsResponse>('/api/admin/settings');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDraft(
      Object.fromEntries(
        data.settings.map((s) => [
          s.key,
          typeof s.value === 'boolean' ? String(s.value) : s.value === null ? '' : String(s.value),
        ]),
      ),
    );
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      await apiJson('/api/admin/settings', 'PUT', {
        settings: Object.entries(draft).map(([key, value]) => ({
          key,
          value: value === 'true' ? true : value === 'false' ? false : value,
        })),
      });
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <CardSkeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <SettingsIcon className="h-5 w-5 text-royal-600" /> Platform settings
        </h2>
        <p className="mt-1 text-xs text-slate-500">Changes take effect immediately and are written to the audit log.</p>

        <form onSubmit={save} className="mt-5 space-y-4">
          {data?.settings.map((s) => (
            <div key={s.key} className="border-b border-slate-100 pb-4 last:border-0">
              <label htmlFor={s.key} className="flex items-center gap-2 text-xs font-semibold text-navy">
                {s.key}
                {s.isDefault ? <span className="badge bg-slate-100 text-slate-600">default</span> : null}
              </label>
              <p className="mt-0.5 text-[11px] text-slate-500">{s.description}</p>
              {typeof s.value === 'boolean' ? (
                <select
                  id={s.key}
                  value={draft[s.key] ?? String(s.value)}
                  onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                  className="input mt-2 w-56"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  id={s.key}
                  value={draft[s.key] ?? ''}
                  onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                  className="input mt-2 w-80"
                />
              )}
            </div>
          ))}

          {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
          {saved ? <p className="text-xs text-teal-700">Settings saved.</p> : null}

          <button type="submit" disabled={busy} className="btn-primary text-xs">
            <Save className="h-3 w-3" /> {busy ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-navy">AI &amp; retrieval status</h3>
        <p className="mt-1 text-xs text-slate-500">
          In <strong>demo</strong> mode the counsellor replies are deterministic and templated — no external model is
          called. Switch to an LLM provider in the environment before relying on generated wording.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Provider', value: data?.ai.provider },
            { label: 'Model', value: data?.ai.model },
            { label: 'Mode', value: data?.ai.mode },
            { label: 'RAG mode', value: data?.ai.ragMode },
          ].map((x) => (
            <div key={x.label} className="rounded-lg bg-surface p-3">
              <dt className="text-[11px] text-slate-500">{x.label}</dt>
              <dd className="mt-1 text-sm font-bold capitalize text-navy">{x.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
