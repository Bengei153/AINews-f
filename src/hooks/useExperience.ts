import { useEffect, useRef } from 'react';

/** Progressive enhancement: no content depends on animation or JavaScript observers. */
export function useExperience(pathname: string) {
  const previousPath = useRef(pathname);
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const navigated = previousPath.current !== pathname;
    previousPath.current = pathname;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canReveal = !reduced.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let frame = 0;
    let focusPending = navigated;
    const seen = new WeakSet<Element>();
    const observer = canReveal && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }) : null;
    let mutations: MutationObserver | null = null;

    const enhance = () => {
      const heading = main.querySelector('h1');
      if (heading) {
        document.title = pathname === '/' ? 'AI Brief — Learn AI. Use AI. Stay Ahead.' : `${heading.textContent?.trim()} — AI Brief`;
        if (focusPending) {
          main.focus({ preventScroll: true });
          focusPending = false;
        }
        // On touch devices we only need the first heading update; avoid watching
        // the whole page while data and interactive controls continue changing.
        if (!canReveal) mutations?.disconnect();
      }
      main.querySelectorAll('.content-section, .sidebar-panel, .spotlight-panel, .journey-card, .dark-cta-panel, .learning-progress').forEach((el, index) => {
        if (seen.has(el) || !observer) return;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        // Visible content never flashes or becomes hidden after rendering.
        if (rect.top < window.innerHeight) return;
        (el as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 65}ms`);
        el.classList.add('reveal-target');
        observer.observe(el);
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(enhance);
    };
    mutations = new MutationObserver(schedule);
    mutations.observe(main, { childList: true, subtree: true });
    if (navigated && !reduced.matches) {
      main.animate?.(
        [
          { opacity: 0.72, transform: 'translateY(5px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
    }
    const showAll = () => {
      if (reduced.matches) main.querySelectorAll('.reveal-target').forEach(el => el.classList.add('is-revealed'));
    };
    reduced.addEventListener('change', showAll);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mutations?.disconnect();
      reduced.removeEventListener('change', showAll);
      main.querySelectorAll('.reveal-target').forEach(el => el.classList.remove('reveal-target'));
    };
  }, [pathname]);
}

/** Accessible modal navigation with focus restoration, Escape, and scroll locking. */
export function useNavigationDialog(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const panel = document.getElementById('mobile-navigation');
    if (!panel) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const main = document.getElementById('main-content');
    const footer = document.querySelector('footer');
    const header = document.querySelector('header');
    const bottom = document.getElementById('mobile-bottom-navigation');
    const blocked = [main, footer, header, bottom].filter(Boolean) as HTMLElement[];
    const inertStates = blocked.map(el => el.inert);
    blocked.forEach(el => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    const focusables = () => [...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(el => el.getClientRects().length > 0);
    (focusables()[0] ?? panel).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    // The overlay must never leave the desktop UI locked after a resize.
    const desktop = window.matchMedia('(min-width: 1280px)');
    const onResize = () => { if (desktop.matches) closeRef.current(); };
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
      document.body.style.overflow = previousOverflow;
      blocked.forEach((el, i) => { el.inert = inertStates[i]; });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
}
