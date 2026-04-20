document.addEventListener('DOMContentLoaded', function () {

    // ================= Sidebar Elements =================
    const sidebar       = document.getElementById('sidebar');
    const overlay       = document.getElementById('sidebarOverlay');
    const mobileToggle  = document.getElementById('mobileToggle');   // mobile hamburger
    const tabletToggle  = document.getElementById('tabletToggle');   // tablet hamburger
    const sidebarClose  = document.getElementById('sidebarClose');   // mobile close btn

    // ── Mobile: overlay sidebar open/close ──────────────
    function openMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('sidebar-open');
        if (overlay) overlay.classList.add('overlay-active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('overlay-active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeMobileSidebar);
    if (overlay)      overlay.addEventListener('click',      closeMobileSidebar);

    // ── Tablet: expand/collapse icon-only sidebar ────────
    function toggleTabletSidebar() {
        if (!sidebar) return;
        sidebar.classList.toggle('sidebar-expanded');
    }

    if (tabletToggle) tabletToggle.addEventListener('click', toggleTabletSidebar);

    // ── Close mobile sidebar on nav link click ───────────
    if (sidebar) {
        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) closeMobileSidebar();
            });
        });
    }

    // ── Reset on resize ──────────────────────────────────
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            // Reset mobile state when resizing to tablet/desktop
            sidebar?.classList.remove('sidebar-open');
            overlay?.classList.remove('overlay-active');
            document.body.style.overflow = '';
        }
        if (window.innerWidth >= 1200) {
            // Reset tablet expanded state on desktop
            sidebar?.classList.remove('sidebar-expanded');
        }
    });

    // ================= Active Nav Link =================
    const navLinks    = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPath || href === currentPath + '/')) {
            link.classList.add('active');
        }
    });

    // ================= Charts (Dashboard page only) =================
    const revenueCanvas    = document.getElementById('revenueChart');
    const topProductCanvas = document.getElementById('topProductsChart');

    if (revenueCanvas) {
        const chartLabels = JSON.parse(document.getElementById('chart-labels').textContent);
        const chartValues = JSON.parse(document.getElementById('chart-values').textContent);

        new Chart(revenueCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Revenue (₱)',
                    data: chartValues,
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
                    tooltip: {
                        callbacks: { label: c => ' ₱' + Number(c.parsed.y).toLocaleString() }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,.05)' },
                        ticks: { font: { size: 11 }, callback: v => '₱' + Number(v).toLocaleString() }
                    }
                }
            }
        });
    }

    if (topProductCanvas) {
        const topLabels = JSON.parse(document.getElementById('top-labels').textContent);
        const topValues = JSON.parse(document.getElementById('top-values').textContent);

        new Chart(topProductCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: topLabels,
                datasets: [{
                    data: topValues,
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
                    tooltip: {
                        callbacks: { label: c => ` ${c.label}: ${c.parsed} units` }
                    }
                }
            }
        });
    }

    // ================= Products Page =================
    const editModal = document.getElementById('editProductModal');
    if (editModal) {
        editModal.addEventListener('show.bs.modal', function (e) {
            const btn  = e.relatedTarget;
            const id   = btn.dataset.id;
            const form = document.getElementById('editProductForm');
            form.action = form.action.replace(/\/\d+\/([^/]*)$/, `/${id}/$1`);
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
        deleteModal.addEventListener('show.bs.modal', function (e) {
            const btn  = e.relatedTarget;
            const id   = btn.dataset.id;
            const form = document.getElementById('deleteProductForm');
            document.getElementById('deleteProductName').textContent = btn.dataset.name;
            form.action = form.action.replace(/\/\d+\/([^/]*)$/, `/${id}/$1`);
        });
    }

    // ================= Products Filtering =================
    const searchInput    = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter    = document.getElementById('stockFilter');
    const statusFilter   = document.getElementById('statusFilter');
    const tableRows      = document.querySelectorAll('#productsTable tbody tr[data-status]');

    function filterTable() {
        const search   = searchInput?.value.toLowerCase()  || '';
        const category = categoryFilter?.value             || '';
        const stock    = stockFilter?.value                || '';
        const status   = statusFilter?.value               || '';

        tableRows.forEach(row => {
            const name        = row.querySelector('td')?.textContent.toLowerCase() || '';
            const rowCategory = row.dataset.category;
            const rowStock    = row.dataset.stock;
            const rowStatus   = row.dataset.status;

            const matchSearch   = name.includes(search);
            const matchCategory = !category || rowCategory === category;
            const matchStock    = !stock    || rowStock    === stock;
            const matchStatus   = !status   || rowStatus   === status;

            row.style.display = (matchSearch && matchCategory && matchStock && matchStatus) ? '' : 'none';
        });
    }

    if (searchInput)    searchInput.addEventListener('input',    filterTable);
    if (categoryFilter) categoryFilter.addEventListener('change', filterTable);
    if (stockFilter)    stockFilter.addEventListener('change',    filterTable);
    if (statusFilter)   statusFilter.addEventListener('change',   filterTable);

    // ================= Transactions Page =================
    const txTable = document.getElementById('txTable');
    if (txTable) {
        const txSearch   = document.getElementById('txSearch');
        const txStatus   = document.getElementById('txStatus');
        const txDate     = document.getElementById('txDate');
        const txRows     = txTable.querySelectorAll('tbody tr[data-id]');
        const txEmpty    = document.getElementById('txEmptyFilter');
        const todayStr   = new Date().toISOString().slice(0, 10);
        const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        function filterTransactions() {
            const search = txSearch.value.toLowerCase();
            const status = txStatus.value;
            const date   = txDate.value;
            let visible  = 0;

            txRows.forEach(row => {
                const idMatch     = row.dataset.id.includes(search);
                const statusMatch = !status || row.dataset.status === status;
                const rowDate     = row.dataset.date;
                const dateMatch   = !date
                    || (date === 'today' && rowDate === todayStr)
                    || (date === 'week'  && rowDate >= weekAgoStr);

                const show = idMatch && statusMatch && dateMatch;
                row.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            if (txEmpty) txEmpty.classList.toggle('d-none', visible > 0);
        }

        if (txSearch) txSearch.addEventListener('input',  filterTransactions);
        if (txStatus) txStatus.addEventListener('change', filterTransactions);
        if (txDate)   txDate.addEventListener('change',   filterTransactions);
    }

    // ================= Reports Page =================
    const dailyCanvas    = document.getElementById('dailyRevenueChart');
    const categoryCanvas = document.getElementById('categoryChart');
    const monthlyCanvas  = document.getElementById('monthlyRevenueChart');

    if (dailyCanvas) {
        const dailyLabels = JSON.parse(document.getElementById('daily-labels').textContent);
        const dailyValues = JSON.parse(document.getElementById('daily-values').textContent);
        new Chart(dailyCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'Revenue (₱)',
                    data: dailyValues,
                    backgroundColor: 'rgba(13,110,253,0.15)',
                    borderColor: '#0d6efd',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(13,110,253,0.30)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => ' ₱' + Number(c.parsed.y).toLocaleString() } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 10 } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 }, callback: v => '₱' + Number(v).toLocaleString() } }
                }
            }
        });
    }

    if (categoryCanvas) {
        const catLabels = JSON.parse(document.getElementById('cat-labels').textContent);
        const catValues = JSON.parse(document.getElementById('cat-values').textContent);
        new Chart(categoryCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catValues,
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
                    tooltip: { callbacks: { label: c => ` ${c.label}: ₱${Number(c.parsed).toLocaleString()}` } }
                }
            }
        });
    }

    if (monthlyCanvas) {
        const monthlyLabels = JSON.parse(document.getElementById('monthly-labels').textContent);
        const monthlyValues = JSON.parse(document.getElementById('monthly-values').textContent);
        new Chart(monthlyCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Revenue (₱)',
                    data: monthlyValues,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25,135,84,0.07)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#198754',
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
                    tooltip: { callbacks: { label: c => ' ₱' + Number(c.parsed.y).toLocaleString() } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 }, callback: v => '₱' + Number(v).toLocaleString() } }
                }
            }
        });
    }

    // ================= Point of Sale Page =================
    const cartItemsEl = document.getElementById('cart-items');

    if (cartItemsEl) {
        const CSRF_TOKEN   = document.querySelector('meta[name="csrf-token"]')?.content   || '';
        const CHECKOUT_URL = document.querySelector('meta[name="checkout-url"]')?.content || '';
        let cart = {};

        document.querySelectorAll('.product-card').forEach(card => {
            card.style.cursor     = 'pointer';
            card.style.transition = 'all 0.15s ease';
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
                addToCart(this.dataset.id, this.dataset.name, parseFloat(this.dataset.price), parseInt(this.dataset.stock));
            });
        });

        window.addToCart = function (id, name, price, stock) {
            if (cart[id]) {
                if (cart[id].qty >= stock) return;
                cart[id].qty++;
            } else {
                cart[id] = { name, price, stock, qty: 1 };
            }
            renderCart();
        };

        window.updateQty = function (id, delta) {
            if (!cart[id]) return;
            cart[id].qty += delta;
            if (cart[id].qty <= 0)                  delete cart[id];
            else if (cart[id].qty > cart[id].stock)  cart[id].qty = cart[id].stock;
            renderCart();
        };

        window.removeFromCart = function (id) { delete cart[id]; renderCart(); };
        window.clearCart = function () {
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
                total += sub; count += item.qty;
                html += `
                <div class="d-flex align-items-start justify-content-between py-2 border-bottom gap-2">
                    <div style="flex:1; min-width:0;">
                        <small class="fw-semibold d-block text-truncate">${item.name}</small>
                        <small class="text-muted">₱${item.price.toFixed(2)} &times; ${item.qty} = <span class="text-primary fw-semibold">₱${sub.toFixed(2)}</span></small>
                    </div>
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="updateQty(${id}, -1)"><i class="bi bi-dash"></i></button>
                        <span class="small fw-semibold" style="min-width:20px; text-align:center;">${item.qty}</span>
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="updateQty(${id}, 1)"><i class="bi bi-plus"></i></button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeFromCart(${id})"><i class="bi bi-x"></i></button>
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
            const total    = parseFloat(document.getElementById('total-display').textContent.replace('₱', '')) || 0;
            const tendered = parseFloat(document.getElementById('cash-tendered').value) || 0;
            const change   = tendered - total;
            const el       = document.getElementById('change-display');
            el.textContent = `₱${Math.max(change, 0).toFixed(2)}`;
            el.className   = `fw-semibold small ${change >= 0 ? 'text-success' : 'text-danger'}`;
        }

        const cashInput = document.getElementById('cash-tendered');
        if (cashInput) cashInput.addEventListener('input', computeChange);

        window.processCheckout = function () {
            const total    = parseFloat(document.getElementById('total-display').textContent.replace('₱', '')) || 0;
            const tendered = parseFloat(document.getElementById('cash-tendered').value) || 0;
            if (tendered < total) { alert('Cash tendered is less than the total amount.'); return; }
            const items = Object.entries(cart).map(([id, item]) => ({ id, qty: item.qty }));
            fetch(CHECKOUT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
                body: JSON.stringify({ items, cash_tendered: tendered }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) { window.open(data.receipt_url, '_blank'); window.clearCart(); }
                else { alert(data.error || 'Checkout failed. Please try again.'); }
            })
            .catch(() => alert('An error occurred. Please try again.'));
        };

        const productSearch  = document.getElementById('product-search');
        const categorySelect = document.getElementById('category-filter');

        function filterProducts() {
            const query    = productSearch?.value.toLowerCase() || '';
            const category = categorySelect?.value             || '';
            document.querySelectorAll('.product-item').forEach(item => {
                const nameMatch = item.dataset.name.includes(query);
                const catMatch  = !category || item.dataset.category === category;
                item.style.display = (nameMatch && catMatch) ? '' : 'none';
            });
        }

        if (productSearch)  productSearch.addEventListener('input',  filterProducts);
        if (categorySelect) categorySelect.addEventListener('change', filterProducts);
    }

});