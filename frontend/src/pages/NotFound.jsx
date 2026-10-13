import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback.jsx';

export default function NotFound() {
  return (
    <EmptyState icon={Compass} title="This page does not exist" action={<Link to="/dashboard" className="btn-primary">Go to dashboard</Link>}>
      The link may be old or the page may have moved.
    </EmptyState>
  );
}
