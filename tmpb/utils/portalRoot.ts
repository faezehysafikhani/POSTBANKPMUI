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
    document.body.appendChild(root);
  }
  return root;
}
