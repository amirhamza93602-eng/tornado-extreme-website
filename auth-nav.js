/* TORNADO EXTREME — canonical auth navigation (deduplicated). */
(() => {
  const client = window.TOR_SUPABASE_CLIENT;
  const nav = document.querySelector('.topbar .links');
  if (!client || !nav) return;

  const hrefOf = a => (a.getAttribute('href') || '').trim();
  const find = href => [...nav.querySelectorAll('a')].find(a => hrefOf(a) === href);
  const ensure = (href, label, key) => {
    let a = find(href);
    if (!a) { a = document.createElement('a'); a.href = href; nav.appendChild(a); }
    a.textContent = label;
    if (key) a.dataset.sharedAuth = key;
    return a;
  };
  const dedupe = () => {
    const seen = new Set();
    nav.querySelectorAll('a').forEach(a => {
      const href = hrefOf(a);
      const key = href === '#' ? 'logout' : href;
      if (seen.has(key)) a.remove(); else seen.add(key);
    });
  };

  async function render(session) {
    dedupe();
    const register = find('portal-register.html');
    const login = find('portal-login.html');
    const profile = find('portal-profile.html');
    const dashboard = find('portal-dashboard.html');
    const adminLink = find('portal-admin.html');
    const logout = find('#');

    if (!session) {
      if (register) { register.hidden = false; register.textContent = 'Join'; }
      if (login) { login.hidden = false; login.textContent = 'Login'; }
      [profile, dashboard, adminLink, logout].filter(Boolean).forEach(a => a.hidden = true);
      return;
    }

    if (register) register.hidden = true;
    if (login) login.hidden = true;
    ensure('portal-profile.html', 'My Profile', 'profile').hidden = false;
    ensure('portal-dashboard.html', 'Dashboard', 'dashboard').hidden = false;
    const logoutLink = ensure('#', 'Logout', 'logout');
    logoutLink.hidden = false;

    let role = '';
    try {
      const { data } = await client.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      role = data?.role || '';
    } catch (_) {}
    const existingAdmin = find('portal-admin.html');
    if (['admin', 'super_admin'].includes(role)) {
      ensure('portal-admin.html', 'Admin Dashboard', 'admin').hidden = false;
    } else if (existingAdmin) {
      existingAdmin.remove();
    }
    dedupe();
  }

  client.auth.getSession().then(({ data }) => render(data?.session || null));
  client.auth.onAuthStateChange((_event, session) => { render(session); });
  nav.addEventListener('click', async event => {
    const link = event.target.closest('a[data-shared-auth="logout"], a#logout');
    if (!link) return;
    event.preventDefault();
    await client.auth.signOut();
    location.href = 'portal-login.html';
  });
})();
