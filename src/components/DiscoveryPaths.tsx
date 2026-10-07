import { ArrowUpRight, BookOpen, Compass, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const paths = [
  { icon: BookOpen, number: '01', label: 'UNDERSTAND', title: 'Less jargon. More clarity.', copy: 'Make sense of the ideas shaping AI, one practical lesson at a time.', to: '/courses', action: 'Start learning', className: 'journey-card--learn' },
  { icon: Compass, number: '02', label: 'EXPLORE', title: 'Your goal. The right tool.', copy: 'Writing, studying, designing or working smarter. Find your fit.', to: '/tools', action: 'Discover tools', className: 'journey-card--discover' },
  { icon: Layers, number: '03', label: 'MAKE', title: 'From “what if” to “I made this”.', copy: 'Get inspired, try a project, and see what a small idea can become.', to: '/projects', action: 'Explore projects', className: 'journey-card--build' },
];
export function DiscoveryPaths() {
  return <section className="discovery-paths" aria-labelledby="paths-heading">
    <div className="discovery-section-heading"><div><div className="eyebrow">FOLLOW YOUR CURIOSITY</div><h2 id="paths-heading" className="font-serif">There’s a way in for everyone.</h2></div><p>No technical background. No perfect plan.<br />Just pick the direction that feels like you.</p></div>
    <div className="journey-grid">{paths.map(path => <Link key={path.number} to={path.to} className={`journey-card ${path.className}`}><div className="journey-card__top"><span className="journey-icon"><path.icon size={21} strokeWidth={1.6} aria-hidden="true" /></span><span className="journey-number">{path.number}</span></div><div className="eyebrow">{path.label}</div><h3 className="font-serif">{path.title}</h3><p>{path.copy}</p><span className="journey-card__action">{path.action}<ArrowUpRight size={18} aria-hidden="true" /></span></Link>)}</div>
  </section>;
}
