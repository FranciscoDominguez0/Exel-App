// ═══════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY — maps product slug → view config
// Add future tools here when implemented
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = {
  excel: {
    label: 'Procesador Excel',
    viewId: 'view-excel',
    icon: `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  },
  // future tools registered here...
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════════════════════════════════

let sessionToken = localStorage.getItem('exel_token') || '';
let sessionUser  = JSON.parse(localStorage.getItem('exel_user') || 'null');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Username': sessionUser?.username || '',
});

// ═══════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════

let toastTimer = null;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = type; }, 3200);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH TABS
// ═══════════════════════════════════════════════════════════════════════════

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`form-${tab.dataset.tab}`).classList.add('active');
    clearAlerts();
  });
});

function clearAlerts() {
  document.querySelectorAll('.auth-alert').forEach(a => { a.className = 'auth-alert'; a.textContent = ''; });
}

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `auth-alert ${type}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('loginBtn').addEventListener('click', handleLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  clearAlerts();
  if (!username || !password) { showAlert('loginAlert', 'Completa todos los campos.'); return; }

  btn.disabled = true; btn.textContent = 'Verificando...';
  try {
    const res  = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (data.success) {
      sessionToken = data.token;
      sessionUser  = data.user;
      localStorage.setItem('exel_token', sessionToken);
      localStorage.setItem('exel_user', JSON.stringify(sessionUser));
      enterApp();
    } else {
      showAlert('loginAlert', data.error || 'Credenciales incorrectas.');
    }
  } catch (e) { showAlert('loginAlert', 'Error de conexión con el servidor.'); }
  finally { btn.disabled = false; btn.textContent = 'Iniciar Sesión'; }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('registerBtn').addEventListener('click', handleRegister);

async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const nombre   = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const correo   = document.getElementById('regCorreo').value.trim();
  const password = document.getElementById('regPassword').value;
  const telefono = document.getElementById('regTelefono').value.trim();
  const btn = document.getElementById('registerBtn');
  clearAlerts();

  if (!username || !nombre || !apellido || !correo || !password) { showAlert('registerAlert', 'Completa todos los campos obligatorios (*).'); return; }
  if (password.length < 6) { showAlert('registerAlert', 'La contraseña debe tener al menos 6 caracteres.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { showAlert('registerAlert', 'Ingresa un correo electrónico válido.'); return; }

  btn.disabled = true; btn.textContent = 'Registrando...';
  try {
    const res  = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, nombre, apellido, correo, password, telefono }) });
    const data = await res.json();
    if (data.success) {
      showAlert('registerAlert', '✓ Cuenta creada. Inicia sesión.', 'success');
      ['regUsername','regNombre','regApellido','regCorreo','regPassword','regTelefono'].forEach(id => { document.getElementById(id).value = ''; });
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('loginUsername').value = username;
      }, 1400);
    } else {
      showAlert('registerAlert', data.error || 'Error al registrar.');
    }
  } catch (e) { showAlert('registerAlert', 'Error de conexión.'); }
  finally { btn.disabled = false; btn.textContent = 'Crear Cuenta'; }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTER / LEAVE APP
// ═══════════════════════════════════════════════════════════════════════════

async function enterApp() {
  // Sidebar user info
  document.getElementById('navUserName').textContent = `${sessionUser.nombre} ${sessionUser.apellido}`;
  document.getElementById('navUserRole').textContent = sessionUser.role === 'admin' ? 'Administrador' : 'Usuario';
  document.getElementById('navUserRole').className = sessionUser.role === 'admin' ? 'user-role admin' : 'user-role';
  document.getElementById('userAvatar').textContent = sessionUser.nombre.charAt(0).toUpperCase();

  // Show/hide admin nav
  document.getElementById('adminNav').style.display = sessionUser.role === 'admin' ? 'block' : 'none';

  // Show app screen
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  // Build sidebar tools from user's licenses
  const activeProducts = await buildSidebarTools();

  // Default view: admins go to Licenses panel, users go to first valid tool
  if (sessionUser.role === 'admin') {
    switchView('licenses');
  } else {
    // Only allow switching to a tool if its product is still active
    const firstValid = sessionUser.licenses?.find(l => 
      l.valid && 
      TOOLS[l.productSlug] && 
      activeProducts?.some(p => p.slug === l.productSlug)
    );
    if (firstValid) switchView(firstValid.productSlug);
    else switchView('no-access');
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionToken = ''; sessionUser = null;
  localStorage.removeItem('exel_token'); localStorage.removeItem('exel_user');
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
});

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR — DYNAMIC TOOL BUILDING
// ═══════════════════════════════════════════════════════════════════════════

async function buildSidebarTools() {
  const section = document.getElementById('toolsSection');

  try {
    // Fetch active products and user's latest licenses
    const [prodRes, licRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/my/licenses', { headers: authHeaders() }),
    ]);
    const { products = [] } = await prodRes.json();
    const { licenses = [] } = await licRes.json();

    // Update session licenses
    if (sessionUser) {
      sessionUser.licenses = licenses;
      localStorage.setItem('exel_user', JSON.stringify(sessionUser));
    }

    // Keep section label, rebuild items
    const label = section.querySelector('.nav-section-label');
    section.innerHTML = '';
    if (label) section.appendChild(label);

    // Update sidebar license badge
    updateLicenseBadge(licenses);

    if (!products.length) {
      // For users: show placeholder. For admins: hide section.
      if (sessionUser?.role !== 'admin') {
        section.insertAdjacentHTML('beforeend', `<div class="nav-item-soon"><span style="flex:1">No hay herramientas disponibles</span></div>`);
      } else {
        section.style.display = 'none';
      }
      return products;
    }

    // For admins: only show tools they have a VALID license for.
    // For users: show all tools with their status.
    const isAdmin = sessionUser?.role === 'admin';
    let addedCount = 0;

    for (const product of products) {
      const tool    = TOOLS[product.slug];
      const license = licenses.find(l => l.productSlug === product.slug);
      const valid   = license?.valid;
      const expired = license && !license.valid;
      const days    = license?.daysLeft ?? 0;

      // Admins skip tools without a valid license entirely
      if (isAdmin && !valid) continue;

      let badgeClass = valid ? (days <= 7 ? 'expiring' : 'valid') : (expired ? 'expired' : 'none');
      let badgeText  = valid ? `${days}d` : (expired ? 'Expirada' : 'Sin acceso');

      const btn = document.createElement('button');
      btn.className = `nav-item${valid && tool ? '' : ' no-access'}`;
      btn.dataset.view = valid && tool ? product.slug : '';
      btn.innerHTML = `
        ${tool ? tool.icon : `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
        <span style="flex:1">${product.name}</span>
        <span class="nav-license-badge ${badgeClass}">${badgeText}</span>
      `;

      if (valid && tool) {
        btn.addEventListener('click', () => { switchView(product.slug); closeSidebar(); });
      } else {
        btn.addEventListener('click', () => {
          showToast(expired ? `Licencia de "${product.name}" expirada. Contacte al admin.` : `No tienes acceso a "${product.name}".`, 'error');
        });
      }
      section.appendChild(btn);
      addedCount++;
    }

    // If admin has no valid tool licenses → hide the whole section
    if (isAdmin && addedCount === 0) {
      section.style.display = 'none';
      return products;
    }
    section.style.display = '';

    // "Próximamente" placeholder — only for regular users
    if (!isAdmin) {
      section.insertAdjacentHTML('beforeend', `
        <div class="nav-item-soon">
          <svg class="nav-icon" style="width:15px;height:15px;opacity:.4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <span style="flex:1;font-size:13px">Próximamente</span>
          <span class="nav-badge">Pronto</span>
        </div>`);
    }
    return products;
  } catch (e) {
    console.error('Error loading tools:', e);
    return [];
  }
}

function updateLicenseBadge(licenses) {
  const tagContainer = document.getElementById('sidebarLicenseTag');
  if (sessionUser?.role === 'admin') {
    if (tagContainer) tagContainer.style.display = 'none';
    return;
  }
  if (tagContainer) tagContainer.style.display = 'flex';

  const dot  = document.getElementById('licenseTagDot');
  const text = document.getElementById('licenseTagText');
  const validCount = licenses.filter(l => l.valid).length;
  if (validCount > 0) {
    text.textContent = `${validCount} licencia${validCount > 1 ? 's' : ''} activa${validCount > 1 ? 's' : ''}`;
    dot.classList.remove('expired');
  } else if (licenses.length > 0) {
    text.textContent = 'Licencias expiradas';
    dot.classList.add('expired');
  } else {
    text.textContent = 'Sin licencias asignadas';
    dot.classList.add('expired');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW SWITCHER
// ═══════════════════════════════════════════════════════════════════════════

// Admin nav items
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  if (item.closest('#adminNav')) {
    item.addEventListener('click', () => { switchView(item.dataset.view); closeSidebar(); });
  }
});

function switchView(viewId) {
  document.querySelectorAll('.nav-item[data-view]').forEach(i => i.classList.toggle('active', i.dataset.view === viewId));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  // Load data for specific views
  if (viewId === 'users')    loadAdminUsers();
  if (viewId === 'products') loadAdminProducts();
  if (viewId === 'licenses') loadAdminLicenses();
}

// Mobile sidebar
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
document.getElementById('btnMenu').addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('open'); });
overlay.addEventListener('click', closeSidebar);
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════════════════
// MODAL MANAGER
// ═══════════════════════════════════════════════════════════════════════════

let _modalSubmitFn = null;

function openModal(title, bodyHTML, onSubmit, submitLabel = 'Guardar') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalSubmitBtn').textContent = submitLabel;
  _modalSubmitFn = onSubmit;
  document.getElementById('mainModal').classList.add('active');
}

function closeModal() { document.getElementById('mainModal').classList.remove('active'); _modalSubmitFn = null; }

document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
document.getElementById('modalSubmitBtn').addEventListener('click', () => { if (_modalSubmitFn) _modalSubmitFn(); });
document.getElementById('mainModal').addEventListener('click', e => { if (e.target === document.getElementById('mainModal')) closeModal(); });

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — USERS
// ═══════════════════════════════════════════════════════════════════════════

async function loadAdminUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">Cargando...</td></tr>`;
  try {
    const res  = await fetch('/api/admin/users', { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-red)">Error al cargar.</td></tr>`; return; }

    const users = data.users;
    document.getElementById('statTotal').textContent  = users.length;
    document.getElementById('statAdmins').textContent = users.filter(u => u.role === 'admin').length;
    document.getElementById('statUsers').textContent  = users.filter(u => u.role === 'user').length;

    if (!users.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">Sin usuarios.</td></tr>`; return; }

    tbody.innerHTML = users.map(u => {
      const date   = new Date(u.created_at).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
      const isSelf = u.username === sessionUser?.username;
      return `<tr>
        <td class="td-secondary">${u.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:30px;height:30px;border-radius:6px;background:var(--red-gradient);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${u.nombre.charAt(0).toUpperCase()}</div>
            <div><div style="font-weight:600">${u.nombre} ${u.apellido}</div><div class="td-secondary">${u.correo}</div></div>
          </div>
        </td>
        <td><span style="font-weight:500">@${u.username}</span></td>
        <td class="td-secondary">${u.telefono || '—'}</td>
        <td><span class="role-badge ${u.role}">${u.role === 'admin' ? '⬡ Admin' : 'Usuario'}</span></td>
        <td class="td-secondary">${date}</td>
        <td><div class="table-actions">
          <button class="tbl-action edit" onclick="editUser(${u.id}, '${u.nombre}', '${u.apellido}', '${u.correo}', '${u.telefono || ''}', '${u.username}')" title="Editar cuenta"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
          ${!isSelf ? `<button class="tbl-action ${u.role==='admin'?'demote':'promote'}" onclick="toggleRole(${u.id},'${u.role==='admin'?'user':'admin'}',this)">${u.role==='admin'?'Quitar admin':'Hacer admin'}</button>` : ''}
          ${!isSelf ? `<button class="tbl-action delete" onclick="deleteUser(${u.id},this)" title="Eliminar"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>` : ''}
        </div></td>
      </tr>`;
    }).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-red)">Error de conexión.</td></tr>`; }
}

async function deleteUser(id, btn) {
  if (!confirm('¿Eliminar este usuario? También se eliminarán sus licencias.')) return;
  btn.disabled = true;
  try {
    const res = await fetch(`/api/admin/users/${id}`, { method:'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (data.success) { showToast('Usuario eliminado.'); loadAdminUsers(); }
    else showToast(data.error || 'Error al eliminar.', 'error');
  } catch (e) { showToast('Error de conexión.', 'error'); } finally { btn.disabled = false; }
}

async function toggleRole(id, newRole, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`/api/admin/users/${id}/role`, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ role: newRole }) });
    const data = await res.json();
    if (data.success) { showToast('Rol actualizado.'); loadAdminUsers(); }
    else showToast(data.error || 'Error.', 'error');
  } catch (e) { showToast('Error.', 'error'); } finally { btn.disabled = false; }
}

function editUser(id, nombre, apellido, correo, telefono, username) {
  openModal(`Editar Usuario (@${username})`,
    `<div class="form-row">
       <div class="form-group"><label>Nombre</label><input type="text" id="eu-nombre" value="${nombre}"></div>
       <div class="form-group"><label>Apellido</label><input type="text" id="eu-apellido" value="${apellido}"></div>
     </div>
     <div class="form-group"><label>Correo</label><input type="email" id="eu-correo" value="${correo}"></div>
     <div class="form-group"><label>Teléfono</label><input type="text" id="eu-telefono" value="${telefono}"></div>
     <div class="form-group">
       <label>Nueva Contraseña <span style="font-size:10px;color:var(--text-muted)">(Dejar en blanco para mantener la actual)</span></label>
       <input type="password" id="eu-pass" placeholder="••••••••">
     </div>`,
    async () => {
      const n = document.getElementById('eu-nombre').value.trim();
      const a = document.getElementById('eu-apellido').value.trim();
      const c = document.getElementById('eu-correo').value.trim();
      const t = document.getElementById('eu-telefono').value.trim();
      const p = document.getElementById('eu-pass').value;

      if (!n || !a || !c) { showToast('Nombre, apellido y correo son requeridos.', 'error'); return; }

      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ nombre: n, apellido: a, correo: c, telefono: t, password: p })
        });
        const data = await res.json();
        if (data.success) { closeModal(); showToast('Usuario actualizado.'); loadAdminUsers(); }
        else showToast(data.error || 'Error al actualizar.', 'error');
      } catch (e) { showToast('Error de conexión.', 'error'); }
    }, 'Actualizar Usuario');
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════

async function loadAdminProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = `<div style="color:var(--text-muted);font-size:14px;padding:20px">Cargando productos...</div>`;
  try {
    const res  = await fetch('/api/admin/products', { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) { grid.innerHTML = `<div style="color:var(--text-red)">Error al cargar.</div>`; return; }

    const products = data.products;
    document.getElementById('statProdTotal').textContent  = products.length;
    document.getElementById('statProdActive').textContent = products.filter(p => p.active).length;

    if (!products.length) {
      grid.innerHTML = `<div style="color:var(--text-muted);font-size:14px;padding:20px">No hay productos. Crea el primero.</div>`;
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card ${p.active ? '' : 'inactive'}" id="prod-card-${p.id}">
        <div class="product-card-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="product-icon">
              <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </div>
            <div>
              <div class="product-card-name">${p.name}</div>
              <div class="product-card-slug">slug: ${p.slug}</div>
            </div>
          </div>
          <label class="toggle-switch" title="${p.active ? 'Desactivar' : 'Activar'}">
            <input type="checkbox" ${p.active ? 'checked' : ''} onchange="toggleProduct(${p.id}, this.checked)">
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="product-card-desc">${p.description || '<em style="color:var(--text-muted)">Sin descripción</em>'}</div>
        <div class="product-card-foot">
          <span class="product-licenses-count">🔑 ${p.license_count} licencia${p.license_count !== 1 ? 's' : ''} asignada${p.license_count !== 1 ? 's' : ''}</span>
          <div class="product-actions">
            <button class="danger" onclick="deleteProduct(${p.id},'${p.name}')">Eliminar</button>
          </div>
        </div>
      </div>`).join('');
  } catch (e) { grid.innerHTML = `<div style="color:var(--text-red)">Error de conexión.</div>`; }
}

function openNewProductModal() {
  openModal('Nuevo Producto',
    `<div class="form-group"><label for="mi-name">Nombre *</label><input type="text" id="mi-name" placeholder="Ej: Generador de PDF"></div>
     <div class="form-group"><label for="mi-slug">Slug * <span style="font-size:10px;color:var(--text-muted)">(solo letras, números y guiones)</span></label><input type="text" id="mi-slug" placeholder="generador-pdf"></div>
     <div class="form-group"><label for="mi-desc">Descripción</label><input type="text" id="mi-desc" placeholder="Descripción breve del producto"></div>`,
    async () => {
      const name = document.getElementById('mi-name').value.trim();
      const slug = document.getElementById('mi-slug').value.trim();
      const desc = document.getElementById('mi-desc').value.trim();
      if (!name || !slug) { showToast('Nombre y slug son requeridos.', 'error'); return; }
      try {
        const res  = await fetch('/api/admin/products', { method:'POST', headers: authHeaders(), body: JSON.stringify({ name, slug, description: desc }) });
        const data = await res.json();
        if (data.success) { closeModal(); showToast('Producto creado.'); loadAdminProducts(); }
        else showToast(data.error || 'Error.', 'error');
      } catch (e) { showToast('Error de conexión.', 'error'); }
    }, 'Crear Producto');

  // Auto-generate slug from name
  setTimeout(() => {
    const nameEl = document.getElementById('mi-name');
    const slugEl = document.getElementById('mi-slug');
    if (nameEl && slugEl) {
      nameEl.addEventListener('input', () => {
        slugEl.value = nameEl.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      });
    }
  }, 50);
}

async function toggleProduct(id, active) {
  try {
    await fetch(`/api/admin/products/${id}`, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ active }) });
    showToast(active ? 'Producto activado.' : 'Producto desactivado.', 'info');
    loadAdminProducts();
  } catch (e) { showToast('Error.', 'error'); }
}

async function deleteProduct(id, name) {
  if (!confirm(`¿Eliminar el producto "${name}"? Se revocarán TODAS sus licencias.`)) return;
  try {
    const res  = await fetch(`/api/admin/products/${id}`, { method:'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (data.success) { showToast('Producto eliminado.'); loadAdminProducts(); }
    else showToast(data.error || 'Error.', 'error');
  } catch (e) { showToast('Error.', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — LICENSES
// ═══════════════════════════════════════════════════════════════════════════

let _allUsers    = [];
let _allProducts = [];

async function loadAdminLicenses() {
  const tbody = document.getElementById('licensesTableBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">Cargando...</td></tr>`;

  try {
    const [licRes, userRes, prodRes] = await Promise.all([
      fetch('/api/admin/licenses', { headers: authHeaders() }),
      fetch('/api/admin/users',    { headers: authHeaders() }),
      fetch('/api/admin/products', { headers: authHeaders() }),
    ]);
    const { licenses = [] } = await licRes.json();
    const { users = [] }    = await userRes.json();
    const { products = [] } = await prodRes.json();

    _allUsers    = users;
    _allProducts = products;

    // Stats
    document.getElementById('statLicTotal').textContent   = licenses.length;
    document.getElementById('statLicActive').textContent  = licenses.filter(l => l.valid).length;
    document.getElementById('statLicExpired').textContent = licenses.filter(l => !l.valid).length;

    if (!licenses.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No hay licencias asignadas. Asigna la primera.</td></tr>`;
      return;
    }

    tbody.innerHTML = licenses.map(l => {
      const expDate = new Date(l.expiration_date).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
      const expISO  = new Date(l.expiration_date).toISOString().split('T')[0];
      const statusClass = l.valid ? (l.daysLeft <= 7 ? 'expiring' : 'valid') : 'expired';
      const statusLabel = l.valid ? (l.daysLeft <= 7 ? `⚠ ${l.daysLeft}d` : `✓ ${l.daysLeft}d`) : 'Expirada';

      return `<tr>
        <td>
          <div style="font-weight:600">${l.nombre} ${l.apellido}</div>
          <div class="td-secondary">@${l.username}</div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:24px;height:24px;border-radius:5px;background:var(--red-gradient);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="12" height="12" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </div>
            <div><div style="font-size:13px;font-weight:600">${l.product_name}</div><div class="td-secondary" style="font-size:10px">${l.product_slug}</div></div>
          </div>
        </td>
        <td style="font-size:13px">${expDate}</td>
        <td><span class="license-status ${statusClass}"><span class="license-status-dot"></span>${statusLabel}</span></td>
        <td>
          <div class="table-actions">
            <button class="tbl-action promote" onclick="editLicense(${l.id},${l.user_id},${l.product_id},'${expISO}','${l.username}','${l.product_name}')">Editar fecha</button>
            <button class="tbl-action delete" onclick="revokeLicense(${l.id},'${l.username}','${l.product_name}',this)" title="Revocar">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-red)">Error de conexión.</td></tr>`; }
}

function openAssignLicenseModal() {
  const userOpts = _allUsers.map(u => `<option value="${u.id}">${u.nombre} ${u.apellido} (@${u.username})</option>`).join('');
  const prodOpts = _allProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  // Default expiry: today + 30 days
  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  openModal('Asignar Licencia',
    `<div class="form-group"><label for="li-user">Usuario *</label><select id="li-user">${userOpts}</select></div>
     <div class="form-group"><label for="li-prod">Producto *</label><select id="li-prod">${prodOpts}</select></div>
     <div class="form-group"><label for="li-date">Fecha de vencimiento *</label><input type="date" id="li-date" value="${defaultDate}"></div>
     <p style="font-size:12px;color:var(--text-muted)">Si el usuario ya tiene licencia para ese producto, se actualizará la fecha.</p>`,
    async () => {
      const userId  = document.getElementById('li-user').value;
      const prodId  = document.getElementById('li-prod').value;
      const dateVal = document.getElementById('li-date').value;
      if (!userId || !prodId || !dateVal) { showToast('Completa todos los campos.', 'error'); return; }
      const expMs = new Date(dateVal).getTime();
      try {
        const res  = await fetch('/api/admin/licenses', { method:'POST', headers: authHeaders(), body: JSON.stringify({ userId, productId: prodId, expirationDate: expMs }) });
        const data = await res.json();
        if (data.success) { closeModal(); showToast('Licencia asignada.'); loadAdminLicenses(); }
        else showToast(data.error || 'Error.', 'error');
      } catch (e) { showToast('Error de conexión.', 'error'); }
    }, 'Asignar');
}

function editLicense(id, userId, productId, currentDateISO, username, productName) {
  openModal(`Editar Licencia — ${productName}`,
    `<p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">Usuario: <strong>${username}</strong></p>
     <div class="form-group"><label for="el-date">Nueva fecha de vencimiento *</label><input type="date" id="el-date" value="${currentDateISO}"></div>`,
    async () => {
      const dateVal = document.getElementById('el-date').value;
      if (!dateVal) { showToast('Selecciona una fecha.', 'error'); return; }
      const expMs = new Date(dateVal).getTime();
      try {
        const res  = await fetch('/api/admin/licenses', { method:'POST', headers: authHeaders(), body: JSON.stringify({ userId, productId, expirationDate: expMs }) });
        const data = await res.json();
        if (data.success) { closeModal(); showToast('Fecha actualizada.'); loadAdminLicenses(); }
        else showToast(data.error || 'Error.', 'error');
      } catch (e) { showToast('Error.', 'error'); }
    }, 'Actualizar');
}

async function revokeLicense(id, username, productName, btn) {
  if (!confirm(`¿Revocar la licencia de "${productName}" para @${username}?`)) return;
  btn.disabled = true;
  try {
    const res  = await fetch(`/api/admin/licenses/${id}`, { method:'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (data.success) { showToast('Licencia revocada.'); loadAdminLicenses(); }
    else showToast(data.error || 'Error.', 'error');
  } catch (e) { showToast('Error.', 'error'); } finally { btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL VIEW
// ═══════════════════════════════════════════════════════════════════════════

const dropArea    = document.getElementById('dropArea');
const fileInput   = document.getElementById('fileInput');
const mainView    = document.getElementById('main-view');
const loadingView = document.getElementById('loading-view');
const resultView  = document.getElementById('result-view');
const expiredView = document.getElementById('expired-view');
const errorText   = document.getElementById('errorText');
const valBefore   = document.getElementById('valBefore');
const valAfter    = document.getElementById('valAfter');

let outputWorkbook = null;
let outputFilename = null;

dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop', e => {
  e.preventDefault(); dropArea.classList.remove('drag-over');
  if (e.dataTransfer.files.length) handleFileStart(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => { if (e.target.files.length) handleFileStart(e.target.files[0]); });

document.getElementById('resetBtn').addEventListener('click', () => { showExcelView('main'); fileInput.value = ''; outputWorkbook = null; });
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!outputWorkbook) return;
  setTimeout(() => {
    try { XLSX.writeFile(outputWorkbook, outputFilename); } catch (err) { showExcelError('Error al guardar: ' + err.message); }
    showExcelView('result');
  }, 150);
});

function checkUserLicense() {
  const lic = sessionUser?.licenses?.find(l => l.productSlug === 'excel');
  return lic?.valid === true;
}

async function showExcelView(view) {
  mainView.style.display   = 'none';
  loadingView.classList.remove('active');
  resultView.classList.remove('active');
  expiredView.style.display = 'none';
  errorText.style.display   = 'none';

  const hasLicense = checkUserLicense();
  if (!hasLicense) { expiredView.style.display = 'block'; return; }

  if (view === 'main')    mainView.style.display   = 'block';
  if (view === 'loading') loadingView.classList.add('active');
  if (view === 'result')  resultView.classList.add('active');
}

function showExcelError(msg) { showExcelView('main'); errorText.textContent = msg; errorText.style.display = 'block'; }

async function handleFileStart(file) {
  if (!checkUserLicense()) { showExcelView('main'); return; }
  await showExcelView('loading');
  setTimeout(() => processFile(file), 150);
}

// Date helpers
const pad      = n => n.toString().padStart(2, '0');
const fmtDate  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtShort = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const toJsDate = val => {
  if (val instanceof Date) return val;
  if (typeof val === 'number') { const p = XLSX.SSF.parse_date_code(val); return p ? new Date(p.y, p.m-1, p.d, p.H, p.M, Math.round(p.S)) : null; }
  if (typeof val === 'string') { const d = new Date(val.replace(' ','T')); return isNaN(d.getTime()) ? null : d; }
  return null;
};

const findDataSheet = wb => {
  const n = wb.SheetNames;
  return n.find(s => /historical|hist[oó]ric/i.test(s)) || (n.length > 1 ? n[1] : n[0]);
};

const autofitColumns = aoa => {
  const w = [];
  for (const row of aoa) {
    if (!row) continue;
    row.forEach((cell, c) => {
      if (cell == null) return;
      const len = cell.toString().length;
      if (!w[c] || w[c].wch < len) w[c] = { wch: Math.min(len + 2, 50) };
    });
  }
  return w;
};

const processFile = file => {
  const reader = new FileReader();
  reader.onerror = () => showExcelError('Error al leer el archivo.');
  reader.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array', cellDates:true });
      const sheetName = findDataSheet(wb);
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null });
      if (!rows || rows.length < 4) { showExcelError(`La hoja "${sheetName}" no tiene el formato esperado.`); return; }

      let headerIdx = rows.findIndex(r => r && typeof r[0]==='string' && r[0].trim().toLowerCase()==='time');
      if (headerIdx === -1) headerIdx = 2;
      const preamble = rows.slice(0, headerIdx+1);
      const dataRows = rows.slice(headerIdx+1);
      const interval = parseInt(document.getElementById('intervalInput').value, 10) || 15;
      const kept = [];
      let nextTarget = null;

      for (const row of dataRows) {
        if (!row || row[0] == null || row[0] === '') continue;
        const d = toJsDate(row[0]);
        if (!d) continue;
        const min = Math.floor(d.getTime() / 60000);
        if (nextTarget === null) nextTarget = min;
        if (min >= nextTarget) {
          const nr = row.slice(); nr[0] = fmtDate(d); kept.push(nr);
          while (nextTarget <= min) nextTarget += interval;
        }
      }

      if (!kept.length) { showExcelError(`No se encontraron registros en intervalos de ${interval} minutos.`); return; }

      const finalAoa = preamble.concat(kept);
      const newWs = XLSX.utils.aoa_to_sheet(finalAoa);
      newWs['!cols'] = autofitColumns(finalAoa);
      const newWb = XLSX.utils.book_new();
      wb.SheetNames.forEach(name => XLSX.utils.book_append_sheet(newWb, name===sheetName ? newWs : wb.Sheets[name], name));

      outputWorkbook = newWb;
      outputFilename = `Historico_${fmtShort(new Date())}.xlsx`;
      valBefore.textContent = dataRows.filter(r => r && r[0]).length.toLocaleString('es');
      valAfter.textContent  = kept.length.toLocaleString('es');
      showExcelView('result');
    } catch (err) { console.error(err); showExcelError('Error procesando: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
};

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════

if (sessionToken && sessionUser) enterApp();
else document.getElementById('auth-screen').classList.add('active');
