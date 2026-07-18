const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ========== DATA ==========
const menu = [
    { id: 1, name: "Beef Burger", price: 12.99, category: "Burgers", image: "🍔" },
    { id: 2, name: "Chicken Pizza", price: 15.99, category: "Pizza", image: "🍕" },
    { id: 3, name: "French Fries", price: 4.99, category: "Sides", image: "🍟" },
    { id: 4, name: "Grilled Chicken", price: 18.99, category: "Main", image: "🍗" },
    { id: 5, name: "Caesar Salad", price: 8.99, category: "Salads", image: "🥗" },
    { id: 6, name: "Chocolate Cake", price: 6.99, category: "Desserts", image: "🍰" },
    { id: 7, name: "Coca Cola", price: 2.99, category: "Drinks", image: "🥤" },
    { id: 8, name: "Fresh Juice", price: 4.99, category: "Drinks", image: "🧃" }
];

let orders = [];
let orderId = 1;

const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "waiter", password: "waiter123", role: "waiter" },
    { username: "chef", password: "chef123", role: "chef" }
];

// ========== LOGIN ==========
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// ========== MENU ==========
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

app.post('/api/menu', (req, res) => {
    const { name, price, category, image } = req.body;
    const newItem = {
        id: menu.length + 1,
        name,
        price: parseFloat(price),
        category,
        image: image || "🍽️"
    };
    menu.push(newItem);
    res.json({ success: true, item: newItem });
});

app.delete('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = menu.findIndex(item => item.id === id);
    if (index !== -1) {
        menu.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// ========== ORDERS ==========
app.post('/api/order', (req, res) => {
    const { customerName, phone, items, total, specialInstructions, tableNumber } = req.body;
    const order = {
        id: orderId++,
        customerName,
        phone,
        items,
        total: parseFloat(total),
        specialInstructions: specialInstructions || '',
        status: 'pending',
        timestamp: new Date().toISOString(),
        tableNumber: tableNumber || '1'
    };
    orders.push(order);
    res.json({ success: true, orderId: order.id });
});

app.get('/api/orders', (req, res) => {
    const { status } = req.query;
    let filteredOrders = orders;
    if (status) {
        filteredOrders = orders.filter(o => o.status === status);
    }
    filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(filteredOrders);
});

app.put('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = req.body.status || order.status;
        res.json({ success: true, order });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.delete('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    orders = orders.filter(o => o.id !== id);
    res.json({ success: true });
});

// ========== STATS ==========
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

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`🍽️ King Weliyano Restaurant Server running on port ${PORT}`);
});
