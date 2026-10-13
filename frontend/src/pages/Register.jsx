import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { Field } from '../components/ui/Field.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'student', title: 'Student', text: 'Create projects and work on tasks with your team.' },
  { value: 'mentor', title: 'Mentor', text: 'Guide teams, review work and leave feedback.' }
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Start your first project"
      subtitle="Create a free account and invite your team in a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <p role="alert" className="rounded-control bg-danger/12 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
        <Field label="Full name" error={errors.name}>
          {(props) => <input {...props} autoComplete="name" className="input" value={form.name} onChange={set('name')} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(props) => <input {...props} type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} />}
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters.">
          {(props) => <input {...props} type="password" autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />}
        </Field>
        <fieldset>
          <legend className="label">I am joining as</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((role) => (
              <label key={role.value} className={`cursor-pointer rounded-control border p-3.5 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${form.role === role.value ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/50'}`}>
                <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={set('role')} className="sr-only" />
                <span className="block font-semibold">{role.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{role.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />}
          Create account
        </button>
      </form>
    </AuthLayout>
  );
}
