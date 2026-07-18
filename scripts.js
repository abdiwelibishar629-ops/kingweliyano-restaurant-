let cart = [];
let menu = [];

// ========== LOAD MENU ==========
async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        menu = await response.json();
        displayMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// ========== DISPLAY MENU ==========
function displayMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    menu.forEach(item => {
        grid.innerHTML += `
            <div class="menu-card">
                <div class="menu-image">${item.image || '🍽️'}</div>
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">$${item.price.toFixed(2)}</p>
                <button class="btn-add" onclick="addToCart(${item.id})">Add to Cart</button>
            </div>
        `;
    });
}

// ========== ADD TO CART ==========
function addToCart(id) {
    const item = menu.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCart();
    showNotification(`✅ Added ${item.name} to cart!`);
}

// ========== REMOVE FROM CART ==========
function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCart();
}

// ========== UPDATE CART ==========
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    let total = 0;
    let itemCount = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. Add some delicious items!</p>';
        cartCount.textContent = '0 items';
        document.getElementById('total').textContent = '0.00';
        return;
    }
    
    cartItems.innerHTML = '';
    cart.forEach(item => {
        total += item.price * item.quantity;
        itemCount += item.quantity;
        cartItems.innerHTML += `
            <div class="cart-item">
                <span>${item.image || '🍽️'} ${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button onclick="removeFromCart(${item.id})" class="btn-remove">✕</button>
            </div>
        `;
    });
    
    cartCount.textContent = `${itemCount} items`;
    document.getElementById('total').textContent = total.toFixed(2);
}

// ========== PLACE ORDER ==========
async function placeOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const tableNumber = document.getElementById('table-number').value.trim();
    const specialInstructions = document.getElementById('special-instructions').value.trim();
    
    if (!name || !phone) {
        showNotification('⚠️ Please enter your name and phone number!', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('⚠️ Your cart is empty!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: name,
                phone: phone,
                items: cart,
                total: parseFloat(document.getElementById('total').textContent),
                tableNumber: tableNumber || '1',
                specialInstructions: specialInstructions
            })
        });
        
        const result = await response.json();
        if (result.success) {
            document.getElementById('order-status').innerHTML = 
                `<div class="success-message">✅ Order #${result.orderId} placed successfully! Your food is being prepared.</div>`;
            cart = [];
            updateCart();
            document.getElementById('customer-name').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('table-number').value = '';
            document.getElementById('special-instructions').value = '';
            showNotification(`✅ Order #${result.orderId} placed!`);
        }
    } catch (error) {
        showNotification('❌ Error placing order. Please try again.', 'error');
    }
}

// ========== SHOW NOTIFICATION ==========
function showNotification(message, type = 'success') {
    const status = document.getElementById('order-status');
    const color = type === 'error' ? '#e74c3c' : '#27ae60';
    status.innerHTML = `<div style="background:${color};color:white;padding:10px;border-radius:5px;margin:10px 0;">${message}</div>`;
    setTimeout(() => {
        status.innerHTML = '';
    }, 5000);
}

// ========== LOAD MENU ON PAGE LOAD ==========
loadMenu();
