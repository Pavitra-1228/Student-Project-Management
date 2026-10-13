import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, RotateCcw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { RoleBadge } from '../components/ui/Badges.jsx';
import { Field } from '../components/ui/Field.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { api, isDemo } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { AVATAR_COLORS } from '../lib/constants.js';
import { formatDate } from '../lib/dates.js';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const stats = useAsync(() => api.analytics.overview(), []);

  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', avatarColor: user.avatarColor });
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [changing, setChanging] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setNameError('Enter your full name');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      setUser(await api.users.updateMe({ name: form.name.trim(), bio: form.bio, avatarColor: form.avatarColor }));
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) {
      setPasswordError('Use at least 8 characters');
      return;
    }
    setPasswordError('');
    setChanging(true);
    try {
      await api.users.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setChanging(false);
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const resetDemo = () => {
    api.resetDemo();
    window.location.assign('/login');
  };

  const totals = stats.data?.totals;

  return (
    <>
      <PageHeader title="Profile" description="Manage how you appear to your team." />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <section className="card flex flex-col items-center p-6 text-center">
            <Avatar name={form.name || user.name} color={form.avatarColor} size="xl" />
            <h2 className="mt-4 text-2xl font-extrabold">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3"><RoleBadge role={user.role} /></div>
            {user.createdAt && <p className="mt-3 text-xs text-muted">Member since {formatDate(user.createdAt.slice(0, 10), true)}</p>}
            <dl className="mt-6 grid w-full grid-cols-3 gap-2 border-t border-line pt-5">
              {[
                ['Projects', totals?.projects],
                ['Open tasks', totals?.myOpen],
                ['Complete', totals ? `${totals.completionRate}%` : undefined]
              ].map(([label, value]) => (
                <div key={label}>
                  <dd className="font-display text-2xl font-extrabold">{value ?? '–'}</dd>
                  <dt className="text-xs text-muted">{label}</dt>
                </div>
              ))}
            </dl>
          </section>

          <section className="card space-y-3 p-5">
            <button type="button" className="btn-secondary w-full" onClick={signOut}><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>
            {isDemo && <button type="button" className="btn-ghost w-full" onClick={resetDemo}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset demo data</button>}
          </section>
        </aside>

        <div className="space-y-5">
          <form onSubmit={saveProfile} className="card space-y-4 p-5 sm:p-6" noValidate>
            <h2 className="text-xl font-bold">Your details</h2>
            <Field label="Full name" error={nameError}>
              {(props) => <input {...props} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />}
            </Field>
            <Field label="Bio" hint={`${form.bio.length}/400`}>
              {(props) => <textarea {...props} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={400} placeholder="Tell your team what you are good at" />}
            </Field>
            <fieldset>
              <legend className="label">Avatar color</legend>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_COLORS.map((color) => (
                  <label key={color} className="relative cursor-pointer">
                    <input type="radio" name="avatarColor" value={color} checked={form.avatarColor === color} onChange={() => setForm({ ...form, avatarColor: color })} className="peer sr-only" />
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand" style={{ backgroundColor: color }}>
                      {form.avatarColor === color && <Check className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    <span className="sr-only">{color}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>{saving && <Spinner />}Save profile</button>
            </div>
          </form>

          <form onSubmit={changePassword} className="card space-y-4 p-5 sm:p-6" noValidate>
            <h2 className="text-xl font-bold">Change password</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current password">
                {(props) => <input {...props} type="password" autoComplete="current-password" className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />}
              </Field>
              <Field label="New password" error={passwordError} hint="At least 8 characters.">
                {(props) => <input {...props} type="password" autoComplete="new-password" className="input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />}
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-secondary" disabled={changing || !passwords.currentPassword}>{changing && <Spinner />}Update password</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
