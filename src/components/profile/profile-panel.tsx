'use client';

import { useEffect, useState } from 'react';
import { UserRound, Save, Loader2 } from 'lucide-react';
import { apiJson, useApi } from '@/lib/hooks';
import { CardSkeleton, ErrorState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';

interface Me {
  user: {
    id: string;
    fullName: string;
    email: string;
    mobile: string | null;
    role: string;
    state: string;
    district: string;
    preferredLanguage: string;
  };
  family: { id: string; code: string; relation: string; consentGranted: boolean } | null;
}

interface StudentProfile {
  age: number | null;
  qualification: string | null;
  academicBackground: string | null;
  interests: string[];
  skills: string[];
  preferredCareerAreas: string[];
  location: string | null;
  aspirations: string | null;
}

interface ParentProfile {
  educationBackground: string | null;
  careerExpectations: string | null;
  financialConcerns: string | null;
  preferredEmploymentType: string | null;
  careerConcerns: string[];
}

const EMPLOYMENT_TYPES = [
  'GOVERNMENT',
  'PRIVATE',
  'SELF_EMPLOYMENT',
  'APPRENTICESHIP',
  'FREELANCE',
  'FAMILY_BUSINESS',
];

const toList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function ProfilePanel({ role }: { role: 'student' | 'parent' }) {
  const me = useApi<Me>('/api/auth/me');
  const profile = useApi<{ profile: StudentProfile | ParentProfile | null }>(`/api/profiles?type=${role}`);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const p = profile.data?.profile;
    if (!p) return;
    setDraft(
      role === 'student'
        ? {
            age: (p as StudentProfile).age ?? '',
            qualification: (p as StudentProfile).qualification ?? '',
            academicBackground: (p as StudentProfile).academicBackground ?? '',
            interests: ((p as StudentProfile).interests ?? []).join(', '),
            skills: ((p as StudentProfile).skills ?? []).join(', '),
            preferredCareerAreas: ((p as StudentProfile).preferredCareerAreas ?? []).join(', '),
            location: (p as StudentProfile).location ?? '',
            aspirations: (p as StudentProfile).aspirations ?? '',
          }
        : {
            educationBackground: (p as ParentProfile).educationBackground ?? '',
            careerExpectations: (p as ParentProfile).careerExpectations ?? '',
            financialConcerns: (p as ParentProfile).financialConcerns ?? '',
            preferredEmploymentType: (p as ParentProfile).preferredEmploymentType ?? '',
            careerConcerns: ((p as ParentProfile).careerConcerns ?? []).join(', '),
          },
    );
  }, [profile.data, role]);

  const set = (key: string, value: unknown) => setDraft({ ...draft, [key]: value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const payload =
        role === 'student'
          ? {
              type: 'student',
              age: draft.age === '' ? null : Number(draft.age),
              qualification: draft.qualification || null,
              academicBackground: draft.academicBackground || null,
              interests: toList(String(draft.interests ?? '')),
              skills: toList(String(draft.skills ?? '')),
              preferredCareerAreas: toList(String(draft.preferredCareerAreas ?? '')),
              location: draft.location || null,
              aspirations: draft.aspirations || null,
            }
          : {
              type: 'parent',
              educationBackground: draft.educationBackground || null,
              careerExpectations: draft.careerExpectations || null,
              financialConcerns: draft.financialConcerns || null,
              preferredEmploymentType: draft.preferredEmploymentType || null,
              careerConcerns: toList(String(draft.careerConcerns ?? '')),
            };
      await apiJson('/api/profiles', 'PUT', payload);
      setMsg({ kind: 'ok', text: 'Profile saved.' });
      profile.refetch();
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Could not save your profile' });
    } finally {
      setBusy(false);
    }
  };

  const setLanguage = async (lang: 'EN' | 'HI') => {
    setMsg(null);
    try {
      await apiJson('/api/auth/me', 'PATCH', { preferredLanguage: lang });
      setMsg({ kind: 'ok', text: `Preferred language set to ${lang === 'EN' ? 'English' : 'हिन्दी'}.` });
      me.refetch();
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Could not update the language preference' });
    }
  };

  if (me.loading || profile.loading) return <CardSkeleton rows={5} />;
  if (me.error) return <ErrorState message={me.error} onRetry={me.refetch} />;

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <UserRound className="h-5 w-5 text-royal-600" /> Your account
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-400">Name</dt>
            <dd className="text-sm font-medium text-navy">{me.data?.user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Email</dt>
            <dd className="text-sm font-medium text-navy">{me.data?.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Location</dt>
            <dd className="text-sm font-medium text-navy">
              {me.data?.user.district}, {me.data?.user.state}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Family code</dt>
            <dd className="text-sm font-medium text-navy">{me.data?.family?.code ?? 'Not linked'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Family sharing consent</dt>
            <dd className="text-sm font-medium text-navy">
              {me.data?.family ? (me.data.family.consentGranted ? 'Granted' : 'Not granted') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Preferred language</dt>
            <dd className="mt-1 flex gap-2">
              {(['EN', 'HI'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                    me.data?.user.preferredLanguage === l ? 'bg-royal-600 text-white' : 'bg-surface text-slate-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] text-slate-400">
          Your data is visible only to your family group, counsellors helping you, and administrators. Chat
          conversations are never shared with a counsellor unless you choose to share them.
        </p>
      </section>

      <form onSubmit={save} className="card space-y-4 p-5">
        <h3 className="text-sm font-semibold text-navy">{role === 'student' ? 'Student profile' : 'Parent profile'}</h3>

        {role === 'student' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="p-age" className="text-xs font-semibold text-navy">
                  Age
                </label>
                <input
                  id="p-age"
                  type="number"
                  min={10}
                  max={30}
                  value={String(draft.age ?? '')}
                  onChange={(e) => set('age', e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label htmlFor="p-qual" className="text-xs font-semibold text-navy">
                  Current qualification
                </label>
                <input
                  id="p-qual"
                  value={String(draft.qualification ?? '')}
                  onChange={(e) => set('qualification', e.target.value)}
                  className="input mt-1 w-full"
                  placeholder="Class 10"
                />
              </div>
            </div>
            {[
              { id: 'p-acad', key: 'academicBackground', label: 'Academic background', rows: 2 },
              { id: 'p-int', key: 'interests', label: 'Interests (comma separated)', rows: 1 },
              { id: 'p-skills', key: 'skills', label: 'Skills (comma separated)', rows: 1 },
              { id: 'p-areas', key: 'preferredCareerAreas', label: 'Preferred career areas (comma separated)', rows: 1 },
              { id: 'p-asp', key: 'aspirations', label: 'What do you want to do?', rows: 3 },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-xs font-semibold text-navy">
                  {f.label}
                </label>
                <textarea
                  id={f.id}
                  rows={f.rows}
                  value={String(draft[f.key] ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { id: 'p-edu', key: 'educationBackground', label: 'Your education', rows: 2 },
              { id: 'p-exp', key: 'careerExpectations', label: 'What you expect for your child', rows: 3 },
              { id: 'p-fin', key: 'financialConcerns', label: 'Financial concerns', rows: 3 },
              { id: 'p-conc', key: 'careerConcerns', label: 'Main concerns (comma separated)', rows: 2 },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-xs font-semibold text-navy">
                  {f.label}
                </label>
                <textarea
                  id={f.id}
                  rows={f.rows}
                  value={String(draft[f.key] ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
            ))}
            <div>
              <label htmlFor="p-emp" className="text-xs font-semibold text-navy">
                Preferred employment type
              </label>
              <select
                id="p-emp"
                value={String(draft.preferredEmploymentType ?? '')}
                onChange={(e) => set('preferredEmploymentType', e.target.value)}
                className="input mt-1 w-full"
              >
                <option value="">No preference</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ').toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {msg ? (
          <p className={`text-xs ${msg.kind === 'ok' ? 'text-teal-700' : 'text-red-600'}`}>{msg.text}</p>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary text-xs">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <p className="text-[11px] text-slate-400">
        Today is {formatDate(new Date())}. Last sign-in activity is recorded for your protection.
      </p>
    </div>
  );
}
