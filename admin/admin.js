document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loginBtn').addEventListener('click', async function() {
    const password = document.getElementById('adminPass').value;
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await resp.json();
      if (data.ok) {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminMain').style.display = 'block';
        loadUsers();
        loadPurchases();
        loadGalleryItems();
        loadProducts();

        // Setup database clear functionality
        setupDatabaseControls();
      } else {
        alert('Invalid password - please try again');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error connecting to server');
    }
  });

  // Also allow login with Enter key
  document.getElementById('adminPass').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('loginBtn').click();
    }
  });
});

document.getElementById('sendAnnounce').addEventListener('click', async ()=>{
  const text = document.getElementById('announceText').value.trim();
  if (!text) return alert('Enter announcement');
  try {
    const r = await fetch('/api/admin/announce',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:text})});
    const j = await r.json();
    if (j.ok) alert('Announcement sent'); else alert('Failed');
  } catch(e){console.error(e);alert('Error');}
});

async function loadUsers() {
  const cont = document.getElementById('usersList');
  try {
    const r = await fetch('/api/admin/users');
    const j = await r.json();
    if (j.ok) {
      if (!j.users || j.users.length === 0) {
        cont.innerHTML = '<p>No registered users yet</p>';
        return;
      }
      cont.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            ${j.users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td><strong>${u.username}</strong></td>
                <td>${u.email}</td>
                <td>${new Date(u.created_at).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      cont.innerHTML = '<p>Failed to load users</p>';
    }
  } catch (e) {
    console.error(e);
    cont.innerHTML = '<p>Error loading users</p>';
  }
}

async function loadPurchases(){
  const cont = document.getElementById('purchasesList');
  try{
    const r = await fetch('/api/admin/purchases');
    const j = await r.json();
    if (j.ok){
      if (!j.purchases.length) { cont.innerHTML = '<p>No purchases yet</p>'; return; }
      cont.innerHTML = '<table class="admin-table"><thead><tr><th>ID</th><th>User</th><th>Amount</th><th>Provider</th><th>Status</th><th>Verification</th><th>Transaction ID</th><th>Phone</th><th>Currency</th><th>Time</th><th>Actions</th></tr></thead><tbody>'+j.purchases.map(p=>`
        <tr class="${p.verification_status === 'verified' ? 'verified-row' : ''}">
          <td>${p.id.slice(0,8)}...</td>
          <td>${p.username}</td>
          <td>$${p.amount}</td>
          <td>${p.provider}</td>
          <td>${p.status}</td>
          <td><span class="status-${p.verification_status}">${p.verification_status}</span></td>
          <td>${p.transaction_id || 'N/A'}</td>
          <td>${p.phone_number || 'N/A'}</td>
          <td>${p.currency || 'NPR'}</td>
          <td>${new Date(p.created_at).toLocaleString()}</td>
          <td>
            ${p.verification_status !== 'verified' ? `<button class="verify-btn" onclick="verifyPurchase('${p.id}')">Verify</button>` : '<span class="verified-badge">✓ Verified</span>'}
          </td>
        </tr>
      `).join('')+'</tbody></table>';
    } else {
      cont.innerHTML = '<p>Failed to load</p>';
    }
  }catch(e){console.error(e);cont.innerHTML='<p>Error loading</p>'}
}

async function verifyPurchase(purchaseId) {
  if (!confirm('Are you sure you want to verify this purchase?')) return;

  try {
    const response = await fetch('/api/admin/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId })
    });

    const data = await response.json();
    if (data.ok) {
      alert('Purchase verified successfully!');
      loadPurchases(); // Refresh the purchases list
    } else {
      alert('Failed to verify purchase: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error verifying purchase:', error);
    alert('Error verifying purchase. Please try again.');
  }
}

// Database management functions
function setupDatabaseControls() {
  const clearBtn = document.getElementById('clearDatabaseBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearDatabase);
  }
}

async function clearDatabase() {
  if (!confirm('⚠️ WARNING: This will permanently delete ALL users and purchases!\n\nThis action cannot be undone. Are you sure?')) {
    return;
  }

  if (!confirm('FINAL CONFIRMATION: Are you absolutely sure you want to clear the entire database?')) {
    return;
  }

  try {
    const response = await fetch('/api/admin/clear-database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    if (data.ok) {
      alert('✅ Database cleared successfully!\n\nAll users and purchases have been removed.');
      // Refresh all data
      loadUsers();
      loadPurchases();
      loadProducts();
    } else {
      alert('❌ Failed to clear database: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    alert('❌ Error clearing database. Please try again.');
  }
}

// Shop management functions
async function loadProducts() {
  const container = document.getElementById('productsList');
  if (!container) return;

  container.innerHTML = '<p>Loading products...</p>';

  try {
    // Get products and sales information
    const [productsResponse, salesResponse] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/product-sales')
    ]);

    const productsData = await productsResponse.json();
    const salesData = await salesResponse.json();

    if (productsData.ok) {
      const products = productsData.products;
      const sales = salesData.ok ? salesData.sales : {};

      if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found</p>';
        return;
      }

      container.innerHTML = products.map(product => {
        const saleInfo = sales[product.id];
        const currentPrice = product.priceNPR || product.price;
        const hasSale = saleInfo && saleInfo.percentage > 0;
        const discountedPrice = hasSale ? Math.round(currentPrice * (1 - saleInfo.percentage / 100)) : currentPrice;

        return `
          <div class="product-item">
            <div class="product-info">
              <img src="${product.image}" alt="${product.name}" class="product-image">
              <div class="product-details">
                <h4>${product.name}</h4>
                <p>Type: ${product.type}</p>
              </div>
            </div>
            <div class="product-actions">
              <div class="price-info">
                <span class="product-price ${hasSale ? 'original-price' : ''}">रु ${currentPrice}</span>
                ${hasSale ? `<span class="product-price discounted-price">रु ${discountedPrice}</span>` : ''}
                ${hasSale ? `<span class="sale-badge">${saleInfo.percentage}% OFF</span>` : ''}
              </div>
              <input type="number" class="sale-input" id="sale-${product.id}" placeholder="%" min="0" max="90" value="${saleInfo ? saleInfo.percentage : ''}">
              <button class="apply-sale-btn" onclick="applyProductSale('${product.id}')">Apply</button>
              <button class="remove-sale-btn" onclick="removeProductSale('${product.id}')">Remove</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p>Failed to load products</p>';
    }
  } catch (error) {
    console.error('Error loading products:', error);
    container.innerHTML = '<p>Error loading products</p>';
  }
}

async function applyGlobalSale() {
  const percentage = parseInt(document.getElementById('globalSalePercentage').value);
  if (!percentage || percentage < 0 || percentage > 90) {
    alert('Please enter a valid percentage (0-90)');
    return;
  }

  if (!confirm(`Apply ${percentage}% sale to ALL products?`)) return;

  try {
    const response = await fetch('/api/admin/apply-global-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage })
    });

    const data = await response.json();
    if (data.ok) {
      alert(data.message);
      loadProducts(); // Refresh products list
    } else {
      alert('Failed to apply global sale: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error applying global sale:', error);
    alert('Error applying global sale. Please try again.');
  }
}

async function removeGlobalSale() {
  if (!confirm('Remove sale from ALL products?')) return;

  try {
    const response = await fetch('/api/admin/remove-global-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    if (data.ok) {
      alert(data.message);
      loadProducts(); // Refresh products list
      document.getElementById('globalSalePercentage').value = '';
    } else {
      alert('Failed to remove global sale: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error removing global sale:', error);
    alert('Error removing global sale. Please try again.');
  }
}

async function applyProductSale(productId) {
  const input = document.getElementById(`sale-${productId}`);
  const percentage = parseInt(input.value);

  if (!percentage || percentage < 0 || percentage > 90) {
    alert('Please enter a valid percentage (0-90)');
    return;
  }

  if (!confirm(`Apply ${percentage}% sale to this product?`)) return;

  try {
    const response = await fetch('/api/admin/apply-product-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, percentage })
    });

    const data = await response.json();
    if (data.ok) {
      alert(data.message);
      loadProducts(); // Refresh products list
      input.value = '';
    } else {
      alert('Failed to apply product sale: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error applying product sale:', error);
    alert('Error applying product sale. Please try again.');
  }
}

async function removeProductSale(productId) {
  if (!confirm('Remove sale from this product?')) return;

  try {
    const response = await fetch('/api/admin/remove-product-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    const data = await response.json();
    if (data.ok) {
      alert(data.message);
      loadProducts(); // Refresh products list
    } else {
      alert('Failed to remove product sale: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error removing product sale:', error);
    alert('Error removing product sale. Please try again.');
  }
}

// Add event listeners for global sale buttons
document.addEventListener('DOMContentLoaded', function() {
  const applyGlobalBtn = document.getElementById('applyGlobalSale');
  const removeGlobalBtn = document.getElementById('removeGlobalSale');

  if (applyGlobalBtn) {
    applyGlobalBtn.addEventListener('click', applyGlobalSale);
  }

  if (removeGlobalBtn) {
    removeGlobalBtn.addEventListener('click', removeGlobalSale);
  }
});
