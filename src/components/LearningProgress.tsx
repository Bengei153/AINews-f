import { ArrowRight, Bookmark, Flame, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyGameProfile } from '../api/gamification';
import { useAuth } from '../store/authStore';

export function LearningProgress() {
  const { user, bookmarks } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['game-profile', user?.id], queryFn: getMyGameProfile, enabled: !!user });
  if (!user) return null;
  const metrics = [{ icon: Flame, label: 'Current streak', value: data?.currentStreak, suffix: ' days' }, { icon: Zap, label: 'Experience earned', value: data?.totalXp, suffix: ' XP' }, { icon: Bookmark, label: 'Saved for later', value: bookmarks.length, suffix: ' saved' }];
  return <section className="learning-progress" aria-labelledby="progress-heading"><div className="learning-progress__intro"><div className="eyebrow">YOUR EXPLORATION, AT A GLANCE</div><h2 id="progress-heading" className="font-serif">Keep your curiosity going.</h2><Link to="/me" className="text-link">View your profile<ArrowRight size={15} aria-hidden="true" /></Link></div><div className="learning-progress__metrics" aria-busy={isLoading}>{metrics.map(metric => <div key={metric.label}><metric.icon size={19} aria-hidden="true" /><strong>{metric.value === undefined ? '—' : metric.value.toLocaleString()}{metric.value !== undefined && <span>{metric.suffix}</span>}</strong><p>{metric.label}</p></div>)}</div>{isError && <p className="progress-error" role="status">Progress is unavailable right now. <button type="button" onClick={() => void refetch()}>Try again</button></p>}</section>;
}
