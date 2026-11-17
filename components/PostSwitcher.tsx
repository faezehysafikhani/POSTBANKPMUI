import React, { useEffect } from 'react';
import { api } from '../services/api';
import type { MyPlacement } from '../tmpb/services/orgStructureApi';
import { selectActivePost, setActivePostUser, setHeldPosts, useActivePost } from '../tmpb/utils/activePost';

/**
 * «کار با پست»: someone who holds several posts works as one of them (or one unit's posts) or all of them, as in TM.
 * The choice is sent with every request (X-Active-Posts), so the server counts only what those posts give besides the
 * person's roles. Changing it reloads the page, so every screen and permission follows at once. Hidden with one post.
 */
export const PostSwitcher = ({ userId }: { userId: string }) => {
  const view = useActivePost();

  useEffect(() => { setActivePostUser(userId); }, [userId]);
  useEffect(() => {
    let alive = true;
    const load = () => void api.get<MyPlacement>('/api/org-structure/me').then(r => {
      if (alive && r.ok) setHeldPosts(r.value?.assignment?.positions ?? []);
    });
    load();
    window.addEventListener('focus', load);
    return () => { alive = false; window.removeEventListener('focus', load); };
  }, [userId]);

  if (!view.canSwitch) return null;
  return (
    <label className="post-switcher" title="کار با پست: دسترسی‌ها و آنچه می‌بینید از همین پست است"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }} aria-hidden="true">badge</span>
      <select
        aria-label="کار با پست"
        value={view.selected.key}
        disabled={view.switching}
        onChange={e => { selectActivePost(e.target.value); window.location.reload(); }}
        style={{ maxWidth: '16rem', padding: '0.3rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color, #cbe1d4)', background: 'var(--card-bg-color, #fff)', color: 'var(--text-color, #1e3b2a)', fontFamily: 'inherit' }}
      >
        {view.options.map(o => <option key={o.key} value={o.key}>{o.subtitle ? `${o.title} · ${o.subtitle}` : o.title}</option>)}
      </select>
    </label>
  );
};
