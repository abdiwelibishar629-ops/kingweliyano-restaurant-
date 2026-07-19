const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ============================================================
// DATA
// ============================================================
const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'waiter', password: 'waiter123', role: 'waiter' },
    { id: 3, username: 'chef', password: 'chef123', role: 'chef' }
];

const menu = [
    { id: 1, name: 'Beef Burger', price: 12.99, category: 'Burgers', image: '🍔' },
    { id: 2, name: 'Chicken Pizza', price: 15.99, category: 'Pizza', image: '🍕' },
    { id: 3, name: 'French Fries', price: 4.99, category: 'Sides', image: '🍟' },
    { id: 4, name: 'Grilled Chicken', price: 18.99, category: 'Main', image: '🍗' },
    { id: 5, name: 'Caesar Salad', price: 8.99, category: 'Salads', image: '🥗' },
    { id: 6, name: 'Chocolate Cake', price: 6.99, category: 'Desserts', image: '🍰' },
    { id: 7, name: 'Coca Cola', price: 2.99, category: 'Drinks', image: '🥤' },
    { id: 8, name: 'Fresh Juice', price: 4.99, category: 'Drinks', image: '🧃' }
];

let orders = [];
let orderId = 1;
let sessions = {};
let notifications = [];

// ============================================================
// NOTIFICATION HELPERS
// ============================================================
function addNotification(role, message, orderId, type = 'info') {
    const notif = {
        id: Date.now(),
        role,
        message,
        orderId,
        type,
        read: false,
        timestamp: new Date().toISOString()
    };
    notifications.push(notif);
    return notif;
}

// ============================================================
// AUTH
// ============================================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessions[token] = { id: user.id, username: user.username, role: user.role };
        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, username: user.username, role: user.role } 
        });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    const { token } = req.body;
    if (token) delete sessions[token];
    res.json({ success: true });
});

app.post('/api/verify', (req, res) => {
    const { token } = req.body;
    if (token && sessions[token]) {
        res.json({ success: true, user: sessions[token] });
    } else {
        res.status(401).json({ success: false });
    }
});

// ============================================================
// WAITER MANAGEMENT - ADMIN ONLY
// ============================================================
app.get('/api/users', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role
    }));
    res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
        id: users.length + 1,
        username: username,
        password: password,
        role: 'waiter'
    };
    users.push(newUser);

    res.json({ 
        success: true, 
        user: { id: newUser.id, username: newUser.username, role: newUser.role } 
    });
});

app.delete('/api/users/:id', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin' || user.role === 'chef') {
        return res.status(403).json({ error: 'Cannot delete admin or chef' });
    }

    users = users.filter(u => u.id !== id);
    res.json({ success: true });
});

app.put('/api/users/:id/reset-password', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const user = users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot reset admin password here' });
    }

    user.password = newPassword;
    res.json({ success: true, message: 'Password reset successfully' });
});

// ============================================================
// MENU
// ============================================================
app.get('/api/menu', (req, res) => res.json(menu));

app.post('/api/menu', (req, res) => {
    const { name, price, category, image } = req.body;
    const item = { id: menu.length + 1, name, price: parseFloat(price), category, image: image || '🍽️' };
    menu.push(item);
    res.json({ success: true, item });
});

app.delete('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = menu.findIndex(item => item.id === id);
    if (idx !== -1) {
        menu.splice(idx, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// ============================================================
// ORDERS
// ============================================================
app.post('/api/order', (req, res) => {
    const {
        customerName,
        phone,
        items,
        total,
        specialInstructions,
        tableNumber,
        paymentMethod,
        paymentDetails
    } = req.body;

    const order = {
        id: orderId++,
        customerName,
        phone,
        items,
        total: parseFloat(total),
        specialInstructions: specialInstructions || '',
        status: 'pending',
        timestamp: new Date().toISOString(),
        tableNumber: tableNumber || '1',
        paymentMethod: paymentMethod || 'cash',
        paymentDetails: paymentDetails || {},
        servedBy: null,
        servedAt: null
    };

    orders.push(order);

    addNotification('chef', `🔔 New Order #${order.id} from ${customerName}! (${paymentMethod})`, order.id, 'info');
    addNotification('customer', `✅ Order #${order.id} placed successfully!`, order.id, 'success');

    res.json({ success: true, orderId: order.id });
});

app.get('/api/orders', (req, res) => {
    const { status } = req.query;
    let result = status ? orders.filter(o => o.status === status) : orders;
    res.json(result);
});

app.get('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const order = orders.find(o => o.id === id);
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.put('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const order = orders.find(o => o.id === id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = req.body.status || order.status;

    if (order.status === 'served' && oldStatus === 'ready') {
        order.servedBy = req.body.waiterName || 'Waiter';
        order.servedAt = new Date().toISOString();
    }

    if (order.status === 'preparing' && oldStatus === 'pending') {
        addNotification('customer', `👨‍🍳 Chef is cooking your order #${order.id}!`, order.id, 'info');
        addNotification('all', `🔪 Chef started cooking Order #${order.id}`, order.id, 'info');
    }

    if (order.status === 'ready' && oldStatus === 'preparing') {
        addNotification('waiter', `✅ Order #${order.id} is READY to serve!`, order.id, 'success');
        addNotification('customer', `✅ Your order #${order.id} is ready for pickup!`, order.id, 'success');
        addNotification('all', `🍽️ Order #${order.id} is ready for service`, order.id, 'success');
    }

    if (order.status === 'served' && oldStatus === 'ready') {
        addNotification('chef', `🍽️ Order #${order.id} has been served by ${order.servedBy || 'Waiter'}`, order.id, 'success');
        addNotification('customer', `🍽️ Your order #${order.id} has been served! Enjoy your meal!`, order.id, 'success');
    }

    res.json({ success: true, order });
});

app.delete('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    orders = orders.filter(o => o.id !== id);
    res.json({ success: true });
});

// ============================================================
// NOTIFICATIONS API
// ============================================================
app.get('/api/notifications', (req, res) => {
    const { role } = req.query;
    let result = notifications;
    if (role) {
        result = notifications.filter(n => n.role === role || n.role === 'all');
    }
    result.sort((a, b) => b.id - a.id);
    res.json(result);
});

app.put('/api/notifications/:id/read', (req, res) => {
    const n = notifications.find(n => n.id === parseInt(req.params.id));
    if (n) n.read = true;
    res.json({ success: true });
});

// ============================================================
// STATS
// ============================================================
app.get('/api/stats', (req, res) => {
    res.json({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        preparingOrders: orders.filter(o => o.status === 'preparing').length,
        readyOrders: orders.filter(o => o.status === 'ready').length,
        servedOrders: orders.filter(o => o.status === 'served').length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
    });
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
    console.log(`🍽️ Server running on port ${PORT}`);
    console.log(`👥 Admin: admin / admin123`);
    console.log(`👨‍🍳 Waiters: waiter / waiter123`);
    console.log(`👨‍🍳 Chef: chef / chef123`);
    console.log(`🔒 Only Admin can add/manage waiters`);
});
