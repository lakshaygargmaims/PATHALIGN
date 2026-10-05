'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Info } from 'lucide-react';
import { apiJson, ApiClientError } from '@/lib/hooks';
import { useToast } from '@/components/toast';
import { STATES, districtsFor } from '@/lib/india';

type Role = 'STUDENT' | 'PARENT' | 'COUNSELLOR' | 'ADMIN';

const ROLE_OPTIONS: Array<{ value: Role; label: string; text: string }> = [
  { value: 'STUDENT', label: 'Student', text: 'Explore careers, take assessments, run family consensus' },
  { value: 'PARENT', label: 'Parent / Guardian', text: 'Review options, submit concerns, decide together' },
  { value: 'COUNSELLOR', label: 'Career Counsellor', text: 'Manage cases, sessions and appointments' },
  { value: 'ADMIN', label: 'Government / Admin', text: 'Analytics, data verification, user management' },
];

function dashFor(role: Role): string {
  return role === 'STUDENT' ? '/student' : role === 'PARENT' ? '/parent' : role === 'COUNSELLOR' ? '/counsellor' : '/admin';
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    role: 'STUDENT' as Role,
    state: '',
    district: '',
    preferredLanguage: 'EN' as 'EN' | 'HI',
    familyCode: '',
    isMinor: false,
    guardianName: '',
    staffCode: '',
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const districts = form.state ? districtsFor(form.state) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.fullName.trim().length < 2) return setError('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) return setError('Mobile number must be 10 digits starting with 6–9.');
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError('Password must be at least 8 characters and include both a letter and a number.');
    }
    if (!form.state || !form.district) return setError('Please select your state and district.');
    if (!form.consent) return setError('Please accept the privacy and consent terms to continue.');

    setLoading(true);
    try {
      const res = await apiJson<{ user: { role: Role } }>('/api/auth/register', 'POST', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile || undefined,
        password: form.password,
        role: form.role,
        state: form.state,
        district: form.district,
        preferredLanguage: form.preferredLanguage,
        familyCode: form.familyCode || undefined,
        isMinor: form.isMinor,
        guardianName: form.guardianName || undefined,
        staffCode: form.staffCode || undefined,
        consent: true,
      });
      toast('Account created — welcome to PATHALIGN!', 'success');
      router.replace(dashFor(res.user.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = form.role === 'COUNSELLOR' || form.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Create your PATHALIGN account</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Register as a student, parent, counsellor or administrator. You can join a family group now or later with a
          family code.
        </p>
      </div>

      <form onSubmit={submit} className="card mt-8 space-y-6 p-6 sm:p-8" noValidate>
        {/* Role */}
        <fieldset>
          <legend className="label">I am registering as</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  form.role === r.value ? 'border-royal-500 bg-royal-50 ring-1 ring-royal-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="sr-only"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={() => set('role', r.value)}
                />
                <span className="block text-sm font-semibold text-navy">{r.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{r.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="label">
              Full name
            </label>
            <input id="fullName" className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input id="email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="mobile" className="label">
              Mobile number <span className="text-slate-400">(optional)</span>
            </label>
            <input id="mobile" inputMode="numeric" className="input" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input id="password" type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters, letters + numbers" />
          </div>
          <div>
            <label htmlFor="state" className="label">
              State
            </label>
            <select id="state" className="input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, district: '' }))}>
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="district" className="label">
              District
            </label>
            <input
              id="district"
              className="input"
              list="district-options"
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
              placeholder={districts.length ? 'Type or pick a district' : 'Select a state first'}
              disabled={!form.state}
            />
            <datalist id="district-options">
              {districts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="language" className="label">
              Preferred language
            </label>
            <select id="language" className="input" value={form.preferredLanguage} onChange={(e) => set('preferredLanguage', e.target.value as 'EN' | 'HI')}>
              <option value="EN">English</option>
              <option value="HI">हिंदी (Hindi)</option>
            </select>
          </div>
          <div>
            <label htmlFor="familyCode" className="label">
              Family code <span className="text-slate-400">(optional)</span>
            </label>
            <input id="familyCode" className="input" value={form.familyCode} onChange={(e) => set('familyCode', e.target.value.toUpperCase())} placeholder="FA-XXXXXX" />
          </div>
        </div>

        {(form.role === 'STUDENT' || form.role === 'PARENT') && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" checked={form.isMinor} onChange={(e) => set('isMinor', e.target.checked)} />
              <span>
                I am under 18 years of age (guardian consent workflow applies)
              </span>
            </label>
            {form.isMinor ? (
              <div className="mt-3">
                <label htmlFor="guardian" className="label">
                  Guardian name
                </label>
                <input id="guardian" className="input" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} placeholder="Parent or guardian name" />
              </div>
            ) : null}
          </div>
        )}

        {isStaff ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Info className="h-4 w-4" /> Staff registration code required
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Counsellor and admin accounts need a registration code issued by the deployment administrator
              (ADMIN_REGISTRATION_CODE environment variable).
            </p>
            <input
              className="input mt-3"
              value={form.staffCode}
              onChange={(e) => set('staffCode', e.target.value)}
              placeholder="Staff registration code"
            />
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 p-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
            <span>
              I consent to creating an account and understand that sharing information between family members is
              optional, explicit and revocable from my profile at any time.
            </span>
          </label>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-royal-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
