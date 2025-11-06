// script.js — product storage, rendering, search/filter, add product, delete product

const STORAGE_KEY = 'campus_bazar_products';

/**
 * Seed some demo products on first load
 */
function seedProducts() {
  const demo = [
    {
      id: genId(),
      name: "Discrete Math Book",
      category: "Books",
      desc: "Used but well kept, 2nd year materials.",
      price: 250,
      seller: "Ravi",
      contact: "ravi@student.edu",
      image: "https://picsum.photos/seed/book1/400/300"
    },
    {
      id: genId(),
      name: "Used Laptop Charger",
      category: "Electronics",
      desc: "Compatible with many models, working fine.",
      price: 600,
      seller: "Neha",
      contact: "neha@student.edu",
      image: "https://picsum.photos/seed/charger/400/300"
    },
    {
      id: genId(),
      name: "Hostel Bed Lamp",
      category: "Other",
      desc: "Adjustable lamp, USB powered.",
      price: 150,
      seller: "Aman",
      contact: "aman@student.edu",
      image: "https://picsum.photos/seed/lamp/400/300"
    },
    {
      id: genId(),
      name: "Study Table",
      category: "Furniture",
      desc: "Wooden, foldable, lightweight.",
      price: 1500,
      seller: "Priya",
      contact: "priya@student.edu",
      image: "https://picsum.photos/seed/table/400/300"
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

function genId() {
  return 'p_' + Math.random().toString(36).slice(2,9);
}

// Handle logout
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function localGetProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedProducts();
  try {
    return JSON.parse(raw) || [];
  } catch (e) {
    return seedProducts();
  }
}

// Load products from backend if available, otherwise use local storage demo
async function loadProducts() {
  if (window.api && typeof window.api.getProducts === 'function') {
    try {
      const prods = await window.api.getProducts();
      return Array.isArray(prods) ? prods : [];
    } catch (e) {
      console.error('Error loading products from API', e);
      return localGetProducts();
    }
  }
  return localGetProducts();
}

function saveProducts(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/**
 * Render products into a grid container (Bootstrap row)
 */
function renderProductsToGrid(products, containerId, enableDelete = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = '';
    return;
  }

  const backendMode = !!(window.api && typeof window.api.getProducts === 'function');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  products.forEach(prod => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4 col-lg-3';
    // support both local keys and API keys
    const img = prod.image || prod.image_url || 'https://picsum.photos/400/300';
    const title = prod.name || prod.title || '';
    const category = prod.category || '';
    const price = prod.price || prod.amount || 0;
    const desc = prod.desc || prod.description || '';
    const seller = prod.seller || prod.seller_name || '';
    const contact = prod.contact || prod.seller_contact || '';

    col.innerHTML = `
      <div class="card h-100 product-card shadow-sm">
        <img src="${img}" class="card-img-top" alt="${escapeHtml(title)}">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title mb-1">${escapeHtml(title)}</h6>
          <div class="mb-2 text-muted small">${escapeHtml(category)} • ₹${price}</div>
          <p class="card-text small text-truncate">${escapeHtml(desc)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-primary" onclick="openProductModal('${prod.id}')">View</button>
            ${(() => {
              if (!backendMode) {
                return enableDelete ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${prod.id}')">Delete</button>` : `<small class=\"text-muted\">Seller: ${escapeHtml(seller)}</small>`;
              }
              // backend mode: only show delete if enableDelete flag and current user is the seller
              const pid = prod.id || prod.ID || prod.id;
              const sellerId = prod.seller_id || prod.sellerId || prod.seller_id;
              if (enableDelete && currentUser && sellerId && String(currentUser.id) === String(sellerId)) {
                return `<button class=\"btn btn-sm btn-outline-danger\" onclick=\"deleteProduct('${pid}')\">Delete</button>`;
              }
              return `<small class=\"text-muted\">Seller: ${escapeHtml(seller)}</small>`;
            })()}
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

/**
 * Delete product by ID
 */
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  // Try backend delete if available
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (window.api && typeof window.api.deleteProduct === 'function') {
    const sellerId = currentUser ? currentUser.id : null;
    const res = await window.api.deleteProduct(id, sellerId);
    if (res && res.success) {
      alert('Product deleted successfully!');
      // reload products
      await initShopPage(true);
      return;
    } else {
      alert('Failed to delete product: ' + (res.message || 'Server error'));
      return;
    }
  }

  // Fallback local delete
  const products = localGetProducts().filter(p => p.id !== id);
  saveProducts(products);
  initShopPage(true);
  alert('Product deleted successfully!');
}

/**
 * Render featured (first N) items into container on home
 */
async function renderFeatured(containerId, limit=4) {
  const all = await loadProducts();
  const featured = (all || []).slice(0, limit);
  renderProductsToGrid(featured, containerId);
}

/**
 * Initialize shop page: attach events, render all products
 */
async function initShopPage(enableDelete = false) {
  const gridId = 'product-grid';
  const all = await loadProducts();
  renderProductsToGrid(all, gridId, enableDelete);
  toggleNoProducts((all || []).length === 0);

  const searchEl = document.getElementById('search-input');
  const categoryEl = document.getElementById('category-select');

  function applyFilters() {
    const q = (searchEl.value || '').toLowerCase().trim();
    const cat = categoryEl.value;
    const filtered = (all || []).filter(p => {
      const name = (p.name || p.title || '').toLowerCase();
      const desc = (p.desc || p.description || '').toLowerCase();
      const seller = (p.seller || p.seller_name || '').toLowerCase();
      const matchesQ = name.includes(q) || desc.includes(q) || seller.includes(q);
      const matchesCat = (cat === 'all') || ((p.category || '') === cat);
      return matchesQ && matchesCat;
    });
    renderProductsToGrid(filtered, gridId, enableDelete);
    toggleNoProducts(filtered.length === 0);
  }

  searchEl.addEventListener('input', applyFilters);
  categoryEl.addEventListener('change', applyFilters);
}

function toggleNoProducts(show) {
  const el = document.getElementById('no-products');
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
}

/**
 * Sell page initialization: handle form submit
 */
function initSellPage() {
  const form = document.getElementById('sell-form');
  const alertDiv = document.getElementById('sell-alert');
  const clearBtn = document.getElementById('clear-storage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value;
    const desc = document.getElementById('prod-desc').value.trim();
    const price = Number(document.getElementById('prod-price').value);
    const sellerName = document.getElementById('seller-name').value.trim();
    const sellerContact = document.getElementById('seller-contact').value.trim();
    let image = document.getElementById('prod-image').value.trim();
    if (!image) image = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`;

    // require login when using backend
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) {
      alertDiv.innerHTML = `<div class="alert alert-danger">You must be logged in to post an item.</div>`;
      return;
    }

    const productPayload = {
      name: name,
      category: category,
      description: desc,
      price: price,
      seller_id: currentUser.id,
      image_url: image
    };

    if (window.api && typeof window.api.addProduct === 'function') {
      const res = await window.api.addProduct(productPayload);
      if (res && res.success) {
        alertDiv.innerHTML = `<div class="alert alert-success">Your product "${escapeHtml(name)}" has been posted.</div>`;
        form.reset();
      } else {
        alertDiv.innerHTML = `<div class="alert alert-danger">Failed to post product: ${escapeHtml(res.message || 'Server error')}</div>`;
      }
    } else {
      // fallback: localStorage
      const newProd = { id: genId(), name, category, desc, price, seller: sellerName, contact: sellerContact, image };
      const all = localGetProducts();
      all.unshift(newProd);
      saveProducts(all);
      alertDiv.innerHTML = `<div class="alert alert-success">Your product "${escapeHtml(name)}" has been posted (local demo).</div>`;
      form.reset();
    }
  });

  clearBtn.addEventListener('click', function () {
    if (!confirm('Clear all product listings? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    alertDiv.innerHTML = `<div class="alert alert-warning">All listings cleared. Demo items will be restored on next load.</div>`;
  });
}

/**
 * Open modal with detailed product info
 */
async function openProductModal(prodId) {
  const all = await loadProducts();
  const p = (all || []).find(x => String(x.id) === String(prodId));
  if (!p) return;
  const modalContent = document.getElementById('modal-content-js');
  const img = p.image || p.image_url || 'https://picsum.photos/400/300';
  const title = p.name || p.title || '';
  const price = p.price || 0;
  const category = p.category || '';
  const desc = p.desc || p.description || '';
  const seller = p.seller || p.seller_name || '';
  const contact = p.contact || p.seller_contact || '';

  modalContent.innerHTML = `
    <div class="modal-header">
      <h5 class="modal-title">${escapeHtml(title)}</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body">
      <img src="${img}" alt="${escapeHtml(title)}" class="img-fluid mb-3">
      <p><strong>Price:</strong> ₹${price}</p>
      <p><strong>Category:</strong> ${escapeHtml(category)}</p>
      <p>${escapeHtml(desc)}</p>
      <hr>
      <p><strong>Seller:</strong> ${escapeHtml(seller)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
    </div>
    <div class="modal-footer">
      <a href="mailto:${encodeURIComponent(contact)}" class="btn btn-primary">Contact Seller</a>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  `;
  const modalEl = new bootstrap.Modal(document.getElementById('productModal'));
  modalEl.show();
}

/**
 * Small util: escape HTML
 */
function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return '';
  return String(unsafe)
    .replaceAll('&', "&amp;")
    .replaceAll('<', "&lt;")
    .replaceAll('>', "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Expose functions globally
 */
window.initShopPage = initShopPage;
window.initSellPage = initSellPage;
window.openProductModal = openProductModal;
window.renderFeatured = renderFeatured;
window.deleteProduct = deleteProduct;
