import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Check, Compass, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../store/authStore';
import type { Article } from '../types/api';

const directions = [
  { label: 'Learn', icon: BookOpen, number: '01', title: 'Make AI make sense.', description: 'Clear explanations. Practical lessons. A little more confidence, every time.', steps: ['Understand the idea', 'Try it for yourself', 'Make it part of your day'], to: '/courses', cta: 'Explore learning resources', tag: 'A curious mind is all you need' },
  { label: 'Discover', icon: Compass, number: '02', title: 'Find your unfair advantage.', description: 'Less noise. More useful tools. Start with what you want to accomplish.', steps: ['Choose an everyday goal', 'Find a tool that fits', 'Put it to work'], to: '/tools', cta: 'Find your next AI tool', tag: 'Useful beats overwhelming' },
  { label: 'Build', icon: Layers, number: '03', title: 'Turn an idea into a first draft.', description: 'Small experiments lead to real outcomes. See what you can make with AI.', steps: ['Get inspired by a project', 'Follow a practical guide', 'Share what you made'], to: '/projects', cta: 'Explore hands-on projects', tag: 'Start small. Make something real.' },
];

export function DiscoveryHero({ article }: { article?: Article }) {
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const direction = directions[active];
  const Icon = direction.icon;
  const chooseWithKey = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % directions.length;
    else if (e.key === 'ArrowLeft') next = (index + directions.length - 1) % directions.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = directions.length - 1;
    else return;
    e.preventDefault(); setActive(next); tabs.current[next]?.focus();
  };
  return (
    <section className="discovery-hero" aria-labelledby="discovery-heading">
      <div className="discovery-hero__copy">
        <div className="eyebrow"><span className="status-dot" aria-hidden="true" /> YOUR NEXT CHAPTER IN AI</div>
        <h1 id="discovery-heading" className="discovery-title font-serif">
          {user ? <>Welcome back,<br /><em>{user.fullName.split(' ')[0]}.</em><br /><span>What will you explore?</span></> : <>A little curiosity.<br />A world of<br /><em>possibility.</em></>}
        </h1>
        <p className="discovery-description">Your friendly field guide to AI. Understand what matters, discover tools worth trying, and turn what you learn into something real.</p>
        <div className="discovery-actions">
          <Link to={user ? '/courses' : '/guides'} className="btn-primary">{user ? 'Keep learning' : 'Find your starting point'}<ArrowRight size={17} aria-hidden="true" /></Link>
          <Link to="/tools" className="hero-text-link">Explore AI tools <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="hero-assurance"><span><Check size={14} aria-hidden="true" /> No coding needed to start</span><span><Check size={14} aria-hidden="true" /> Learn at your own pace</span></div>
        {user && <Link to="/settings" className="interest-link">{user.interests?.length ? `Your interests: ${user.interests.join(' · ')}` : 'Make it yours — choose your interests'} <ArrowUpRight size={13} aria-hidden="true" /></Link>}
      </div>
      <div className="discovery-workbench">
        <div className="workbench-top"><span><Sparkles size={15} aria-hidden="true" /> THE CURIOSITY LAB</span><span className="workbench-edition">LEARN / TRY / GROW</span></div>
        <div className="workbench-tabs" role="tablist" aria-label="Choose your AI direction">
          {directions.map((item, index) => <button key={item.label} type="button" role="tab" id={`direction-tab-${index}`} aria-selected={active === index} aria-controls={`direction-panel-${index}`} tabIndex={active === index ? 0 : -1} ref={el => { tabs.current[index] = el; }} onKeyDown={e => chooseWithKey(e, index)} onClick={() => setActive(index)}><item.icon size={15} aria-hidden="true" />{item.label}</button>)}
        </div>
        <div className="workbench-panel" key={active} role="tabpanel" id={`direction-panel-${active}`} aria-labelledby={`direction-tab-${active}`} tabIndex={0}>
          <div className="lab-illustration" aria-hidden="true">
            <svg viewBox="0 0 380 164" fill="none"><path d="M-20 153C51 153 51 21 133 21S236 155 315 155s75-58 106-58" /><path d="M-20 131C49 131 62 0 143 0S248 134 325 134s74-58 104-58" /><path d="M-20 175C51 175 41 43 123 43S224 176 303 176s75-58 107-58" /><circle cx="133" cy="21" r="6" /><circle cx="275" cy="143" r="4" /><path className="lab-guide" d="M188 18v136M12 92h350" /></svg>
            <span className="lab-monogram"><Icon size={32} strokeWidth={1.4} /></span><span className="lab-index">{direction.number}<span>YOUR NEXT MOVE</span></span>
          </div>
          <h2 className="font-serif">{direction.title}</h2><p>{direction.description}</p>
          <ol className="lab-steps">{direction.steps.map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol>
          <Link to={direction.to} className="workbench-cta">{direction.cta}<ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="workbench-note"><span className="note-spark" aria-hidden="true">✳</span>{direction.tag}</div>
      </div>
      {article && <Link to={`/articles/${article.slug}`} className="hero-latest"><span className="hero-latest__label"><span className="status-dot" aria-hidden="true" /> FROM THE BRIEF</span><span className="hero-latest__title">{article.title}</span><span className="hero-latest__time">{article.readTimeMinutes} min read</span><ArrowUpRight size={18} aria-hidden="true" /></Link>}
    </section>
  );
}
