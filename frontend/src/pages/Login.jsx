import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import { Field } from '../components/ui/Field.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMOS = [
  { label: 'Student', email: 'student@projectflow.dev' },
  { label: 'Mentor', email: 'mentor@projectflow.dev' },
  { label: 'Admin', email: 'admin@projectflow.dev' }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your projects, tasks and deadlines."
      footer={<>New to ProjectFlow? <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <p role="alert" className="rounded-control bg-danger/12 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
        <Field label="Email" error={errors.email}>
          {(props) => <input {...props} type="email" autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu" />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(props) => (
            <div className="relative">
              <input {...props} type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-12" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="btn-icon absolute right-0.5 top-0.5" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          )}
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />}
          Sign in
        </button>
      </form>

      <div className="mt-8 rounded-card border border-dashed border-line p-4">
        <p className="text-sm font-semibold">Explore with a demo account</p>
        <p className="mt-1 text-sm text-muted">Password for all demo accounts: Password123!</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMOS.map((demo) => (
            <button key={demo.email} type="button" className="btn-secondary min-h-[38px]" onClick={() => setForm({ email: demo.email, password: 'Password123!' })}>
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
