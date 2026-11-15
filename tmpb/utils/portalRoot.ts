/**
 * Where the settings screens' dialogs and menus are drawn. Not <body> itself: the screens' utility stylesheet is scoped
 * (`.tw-scope`) so it never restyles the product's own pages, and a dialog drawn straight into <body> would be outside it.
 */
export function portalRoot(): HTMLElement {
  let root = document.getElementById('tmpb-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tmpb-portal-root';
    root.className = 'tw-scope';
    // Above the product's header (z-index 1020), side menu (100) and its own dialogs: everything drawn here (dialogs, menus)
    // must cover them. A positioned element with a z-index is also one stacking context for all that is drawn inside.
    root.style.position = 'relative';
    root.style.zIndex = '1300';
    document.body.appendChild(root);
  }
  return root;
}
