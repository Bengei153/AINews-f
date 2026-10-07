import { AlertCircle, ArrowRight, Compass, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ContentState({ title, description, error = false, retry, to, action = 'Explore more' }: { title: string; description: string; error?: boolean; retry?: () => void; to?: string; action?: string }) {
  const Icon = error ? AlertCircle : Compass;
  return <div className={`content-state ${error ? 'content-state--error' : ''}`} role={error ? 'alert' : 'status'}><span className="content-state__icon"><Icon size={23} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p>{error && retry ? <button type="button" className="text-link" onClick={retry}><RefreshCw size={14} aria-hidden="true" />Try again</button> : to && <Link to={to} className="text-link">{action}<ArrowRight size={14} aria-hidden="true" /></Link>}</div></div>;
}
