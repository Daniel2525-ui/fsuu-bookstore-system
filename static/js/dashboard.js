/* ═══════════════════════════════════════════════════════════
   FSUU BOOKSTORE — dashboard.js
   Sections:
     1. Sidebar
     2. Nav active state
     3. Dashboard charts
     4. Products page
     5. Transactions page
     6. Reports page
     7. Point of Sale page
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════
    // 1. SIDEBAR
    // ══════════════════════════════════════════════════════

    const MOBILE_BP   = 767.98;
    const STORAGE_KEY = 'fsuu_sidebar_collapsed';

    const sidebar       = document.getElementById('sidebar');
    const toggleDesktop = document.getElementById('sidebarToggleDesktop');
    const toggleMobile  = document.getElementById('sidebarToggleMobile');
    const backdrop      = document.getElementById('sidebarBackdrop');

    if (!sidebar) return;

    const isMobile = () => window.innerWidth <= MOBILE_BP;

    // ── Desktop: restore saved collapsed preference ──────
    // NEVER called on mobile. sidebar--collapsed is a
    // desktop-only concept — it controls icon-only width.
    function restoreDesktopState() {
        const saved           = localStorage.getItem(STORAGE_KEY);
        const defaultCollapse = window.innerWidth <= 1024;
        const collapse        = saved !== null ? saved === 'true' : defaultCollapse;

        sidebar.classList.add('sidebar--no-transition');
        sidebar.classList.toggle('sidebar--collapsed', collapse);

        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                sidebar.classList.remove('sidebar--no-transition')
            )
        );
    }

    if (!isMobile()) restoreDesktopState();

    // ── Desktop toggle ───────────────────────────────────
    // The toggle button inside the sidebar handles BOTH
    // desktop collapse AND mobile close, depending on viewport.
    toggleDesktop?.addEventListener('click', () => {
        if (isMobile()) {
            // On mobile the in-sidebar hamburger closes the drawer
            closeMobile();
        } else {
            // On desktop it toggles the collapsed icon-only state
            const collapsed = sidebar.classList.toggle('sidebar--collapsed');
            localStorage.setItem(STORAGE_KEY, collapsed);
        }
    });

    // ── Mobile: open ─────────────────────────────────────
    // KEY FIX: never touch sidebar--collapsed on mobile.
    // The CSS already overrides all collapsed-state rules
    // at ≤ 767px, so the sidebar always shows full content
    // regardless of whether that class is present.
    toggleMobile?.addEventListener('click', openMobile);

    function openMobile() {
        sidebar.classList.add('sidebar--mobile-open');
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // ── Mobile: close ────────────────────────────────────
    // KEY FIX: never touch sidebar--collapsed here either.
    // Just remove the mobile-open class — the sidebar slides
    // back off-screen via transform. collapsed state is
    // irrelevant on mobile and restored by restoreDesktopState
    // if the user ever switches to a wider viewport.
    function closeMobile() {
        sidebar.classList.remove('sidebar--mobile-open');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    backdrop?.addEventListener('click', closeMobile);

    // Close drawer when a nav link is tapped on mobile
    sidebar.querySelectorAll('.nav-link').forEach(link =>
        link.addEventListener('click', () => { if (isMobile()) closeMobile(); })
    );

    // ── Resize handler ───────────────────────────────────
    window.addEventListener('resize', () => {
        if (isMobile()) {
            // Crossed into mobile: close any open drawer cleanly.
            // Do NOT call restoreDesktopState — that would add
            // sidebar--collapsed which we don't want on mobile.
            closeMobile();
        } else {
            // Crossed into desktop: clean up mobile state and
            // restore the user's desktop collapsed preference.
            sidebar.classList.remove('sidebar--mobile-open');
            backdrop.classList.remove('show');
            document.body.style.overflow = '';
            restoreDesktopState();
        }
    });


    // ══════════════════════════════════════════════════════
    // 2. NAV ACTIVE STATE
    // ══════════════════════════════════════════════════════

    const currentPath = window.location.pathname;

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPath || href === currentPath + '/')) {
            link.classList.add('active');
        }
    });


    // ══════════════════════════════════════════════════════
    // 3. DASHBOARD CHARTS
    // ══════════════════════════════════════════════════════

    function getJSON(id) {
        const el = document.getElementById(id);
        return el ? JSON.parse(el.textContent) : null;
    }

    // Revenue line chart
    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas) {
        new Chart(revenueCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: getJSON('chart-labels'),
                datasets: [{
                    label: 'Revenue (₱)',
                    data: getJSON('chart-values'),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13,110,253,0.07)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#0d6efd',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => ` ₱${Number(c.parsed.y).toLocaleString()}` } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,.05)' },
                        ticks: { font: { size: 11 }, callback: v => `₱${Number(v).toLocaleString()}` }
                    }
                }
            }
        });
    }

    // Top products doughnut
    const topProductCanvas = document.getElementById('topProductsChart');
    if (topProductCanvas) {
        new Chart(topProductCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: getJSON('top-labels'),
                datasets: [{
                    data: getJSON('top-values'),
                    backgroundColor: ['#0d6efd', '#198754', '#6f42c1', '#ffc107', '#adb5bd'],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
                    tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} units` } }
                }
            }
        });
    }


    // ══════════════════════════════════════════════════════
    // 4. PRODUCTS PAGE
    // ══════════════════════════════════════════════════════

    const editModal = document.getElementById('editProductModal');
    if (editModal) {
        editModal.addEventListener('show.bs.modal', e => {
            const btn  = e.relatedTarget;
            const form = document.getElementById('editProductForm');
            form.action = form.action.replace(/\/\d+\/([^/]*)$/, `/${btn.dataset.id}/$1`);
            document.getElementById('editName').value       = btn.dataset.name;
            document.getElementById('editPrice').value      = btn.dataset.price;
            document.getElementById('editStock').value      = btn.dataset.stock;
            document.getElementById('editThreshold').value  = btn.dataset.threshold;
            document.getElementById('editIsActive').checked = btn.dataset.active === 'true';
            document.getElementById('editCategory').value   = btn.dataset.category;
        });
    }

    const deleteModal = document.getElementById('deleteProductModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', e => {
            const btn  = e.relatedTarget;
            const form = document.getElementById('deleteProductForm');
            document.getElementById('deleteProductName').textContent = btn.dataset.name;
            form.action = form.action.replace(/\/\d+\/([^/]*)$/, `/${btn.dataset.id}/$1`);
        });
    }

    const searchInput    = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter    = document.getElementById('stockFilter');
    const statusFilter   = document.getElementById('statusFilter');

    const productRows = document.querySelectorAll('#productsTable tbody tr[data-status]');
    const mobileCards = document.querySelectorAll('.product-mobile-card');

    if (productRows.length || mobileCards.length) {
        function filterProducts() {
            const search   = searchInput?.value.toLowerCase()  ?? '';
            const category = categoryFilter?.value             ?? '';
            const stock    = stockFilter?.value                ?? '';
            const status   = statusFilter?.value               ?? '';

            productRows.forEach(row => {
                const name = row.querySelector('td')?.textContent.toLowerCase() ?? '';
                const show =
                    name.includes(search)                            &&
                    (!category || row.dataset.category === category) &&
                    (!stock    || row.dataset.stock    === stock)    &&
                    (!status   || row.dataset.status   === status);
                row.style.display = show ? '' : 'none';
            });

            mobileCards.forEach(card => {
                const name = card.querySelector('.fw-semibold')?.textContent.toLowerCase() ?? '';
                const show =
                    name.includes(search)                             &&
                    (!category || card.dataset.category === category) &&
                    (!stock    || card.dataset.stock    === stock)    &&
                    (!status   || card.dataset.status   === status);
                card.style.display = show ? '' : 'none';
            });
        }

        searchInput?.addEventListener('input',     filterProducts);
        categoryFilter?.addEventListener('change', filterProducts);
        stockFilter?.addEventListener('change',    filterProducts);
        statusFilter?.addEventListener('change',   filterProducts);
    }


    // ══════════════════════════════════════════════════════
    // 5. TRANSACTIONS PAGE
    // ══════════════════════════════════════════════════════

    const txTable = document.getElementById('txTable');
    const txCards = document.querySelectorAll('.tx-mobile-card');

    if (txTable || txCards.length) {
        const txSearch   = document.getElementById('txSearch');
        const txStatus   = document.getElementById('txStatus');
        const txDate     = document.getElementById('txDate');
        const txRows     = txTable?.querySelectorAll('tbody tr[data-id]') ?? [];
        const txEmpty    = document.getElementById('txEmptyFilter');
        const todayStr   = new Date().toISOString().slice(0, 10);
        const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

        function filterTransactions() {
            const search = txSearch?.value.toLowerCase() ?? '';
            const status = txStatus?.value               ?? '';
            const date   = txDate?.value                 ?? '';
            let visible  = 0;

            txRows.forEach(row => {
                const rowDate = row.dataset.date;
                const show =
                    row.dataset.id.includes(search)            &&
                    (!status || row.dataset.status === status) &&
                    (!date
                        || (date === 'today' && rowDate === todayStr)
                        || (date === 'week'  && rowDate >= weekAgoStr));
                row.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            txCards.forEach(card => {
                const rowDate = card.dataset.date;
                const show =
                    card.dataset.id.includes(search)            &&
                    (!status || card.dataset.status === status) &&
                    (!date
                        || (date === 'today' && rowDate === todayStr)
                        || (date === 'week'  && rowDate >= weekAgoStr));
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            txEmpty?.classList.toggle('d-none', visible > 0);
        }

        txSearch?.addEventListener('input',  filterTransactions);
        txStatus?.addEventListener('change', filterTransactions);
        txDate?.addEventListener('change',   filterTransactions);
    }


    // ══════════════════════════════════════════════════════
    // 6. REPORTS PAGE
    // ══════════════════════════════════════════════════════

    function makeBarChart(canvasId, labelsId, valuesId, color = '#0d6efd') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: getJSON(labelsId),
                datasets: [{
                    label: 'Revenue (₱)',
                    data: getJSON(valuesId),
                    backgroundColor: `${color}26`,
                    borderColor: color,
                    borderWidth: 1.5,
                    borderRadius: 4,
                    hoverBackgroundColor: `${color}4d`,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => ` ₱${Number(c.parsed.y).toLocaleString()}` } }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 10 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,.05)' },
                        ticks: { font: { size: 11 }, callback: v => `₱${Number(v).toLocaleString()}` }
                    }
                }
            }
        });
    }

    function makeLineChart(canvasId, labelsId, valuesId, color = '#198754') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: getJSON(labelsId),
                datasets: [{
                    label: 'Revenue (₱)',
                    data: getJSON(valuesId),
                    borderColor: color,
                    backgroundColor: `${color}12`,
                    borderWidth: 2.5,
                    pointBackgroundColor: color,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => ` ₱${Number(c.parsed.y).toLocaleString()}` } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,.05)' },
                        ticks: { font: { size: 11 }, callback: v => `₱${Number(v).toLocaleString()}` }
                    }
                }
            }
        });
    }

    makeBarChart('dailyRevenueChart',    'daily-labels',   'daily-values');
    makeLineChart('monthlyRevenueChart', 'monthly-labels', 'monthly-values');

    const categoryCanvas = document.getElementById('categoryChart');
    if (categoryCanvas) {
        new Chart(categoryCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: getJSON('cat-labels'),
                datasets: [{
                    data: getJSON('cat-values'),
                    backgroundColor: ['#0d6efd', '#198754', '#6f42c1', '#ffc107', '#dc3545', '#adb5bd'],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
                    tooltip: {
                        callbacks: { label: c => ` ${c.label}: ₱${Number(c.parsed).toLocaleString()}` }
                    }
                }
            }
        });
    }


    // ══════════════════════════════════════════════════════
    // 7. POINT OF SALE PAGE
    // ══════════════════════════════════════════════════════

    const cartItemsEl = document.getElementById('cart-items');
    if (!cartItemsEl) return;

    const CSRF_TOKEN   = document.querySelector('meta[name="csrf-token"]')?.content   ?? '';
    const CHECKOUT_URL = document.querySelector('meta[name="checkout-url"]')?.content ?? '';

    let cart = {};

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', function () {
            this.style.borderColor = '#0d6efd';
            this.style.transform   = 'translateY(-2px)';
            this.style.boxShadow   = '0 0 0 3px rgba(13,110,253,0.08)';
        });
        card.addEventListener('mouseleave', function () {
            this.style.borderColor = '';
            this.style.transform   = '';
            this.style.boxShadow   = '';
        });
        card.addEventListener('click', function () {
            addToCart(
                this.dataset.id,
                this.dataset.name,
                parseFloat(this.dataset.price),
                parseInt(this.dataset.stock, 10)
            );
        });
    });

    window.addToCart = (id, name, price, stock) => {
        if (cart[id]) {
            if (cart[id].qty >= stock) return;
            cart[id].qty++;
        } else {
            cart[id] = { name, price, stock, qty: 1 };
        }
        renderCart();
    };

    window.updateQty = (id, delta) => {
        if (!cart[id]) return;
        cart[id].qty += delta;
        if      (cart[id].qty <= 0)             delete cart[id];
        else if (cart[id].qty > cart[id].stock) cart[id].qty = cart[id].stock;
        renderCart();
    };

    window.removeFromCart = id => { delete cart[id]; renderCart(); };

    window.clearCart = () => {
        cart = {};
        renderCart();
        const cashInput = document.getElementById('cash-tendered');
        if (cashInput) cashInput.value = '';
    };

    function renderCart() {
        const keys = Object.keys(cart);

        if (!keys.length) {
            cartItemsEl.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-cart fs-1 d-block mb-2"></i>
                    <small>No items yet.<br>Click a product to add.</small>
                </div>`;
            updateTotals(0, 0);
            return;
        }

        let html = '', total = 0, count = 0;

        keys.forEach(id => {
            const item = cart[id];
            const sub  = item.price * item.qty;
            total += sub;
            count += item.qty;
            html += `
                <div class="d-flex align-items-start justify-content-between py-2 border-bottom gap-2">
                    <div style="flex:1; min-width:0;">
                        <small class="fw-semibold d-block text-truncate">${item.name}</small>
                        <small class="text-muted">
                            ₱${item.price.toFixed(2)} &times; ${item.qty} =
                            <span class="text-primary fw-semibold">₱${sub.toFixed(2)}</span>
                        </small>
                    </div>
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2"
                                onclick="updateQty(${id}, -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="small fw-semibold"
                              style="min-width:20px; text-align:center;">${item.qty}</span>
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2"
                                onclick="updateQty(${id}, 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-2"
                                onclick="removeFromCart(${id})">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>`;
        });

        cartItemsEl.innerHTML = html;
        updateTotals(total, count);
        computeChange();
    }

    function updateTotals(total, count) {
        document.getElementById('subtotal-display').textContent   = `₱${total.toFixed(2)}`;
        document.getElementById('total-display').textContent      = `₱${total.toFixed(2)}`;
        document.getElementById('item-count-display').textContent = `${count} item(s)`;
        document.getElementById('checkout-btn').disabled          = count === 0;
    }

    function computeChange() {
        const total    = parseFloat(
            document.getElementById('total-display').textContent.replace('₱', '')
        ) || 0;
        const tendered = parseFloat(document.getElementById('cash-tendered').value) || 0;
        const change   = tendered - total;
        const el       = document.getElementById('change-display');
        el.textContent = `₱${Math.max(change, 0).toFixed(2)}`;
        el.className   = `fw-semibold small ${change >= 0 ? 'text-success' : 'text-danger'}`;
    }

    document.getElementById('cash-tendered')?.addEventListener('input', computeChange);

    window.processCheckout = () => {
        const total    = parseFloat(
            document.getElementById('total-display').textContent.replace('₱', '')
        ) || 0;
        const tendered = parseFloat(document.getElementById('cash-tendered').value) || 0;

        if (tendered < total) {
            alert('Cash tendered is less than the total amount.');
            return;
        }

        const items = Object.entries(cart).map(([id, item]) => ({ id, qty: item.qty }));

        fetch(CHECKOUT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({ items, cash_tendered: tendered }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.open(data.receipt_url, '_blank');
                window.clearCart();
            } else {
                alert(data.error || 'Checkout failed. Please try again.');
            }
        })
        .catch(() => alert('An error occurred. Please try again.'));
    };

    const productSearch  = document.getElementById('product-search');
    const categorySelect = document.getElementById('category-filter');

    function filterPOSProducts() {
        const query    = productSearch?.value.toLowerCase() ?? '';
        const category = categorySelect?.value              ?? '';
        document.querySelectorAll('.product-item').forEach(item => {
            item.style.display =
                (item.dataset.name.includes(query) &&
                (!category || item.dataset.category === category))
                    ? '' : 'none';
        });
    }

    productSearch?.addEventListener('input',   filterPOSProducts);
    categorySelect?.addEventListener('change', filterPOSProducts);

}); // end DOMContentLoaded