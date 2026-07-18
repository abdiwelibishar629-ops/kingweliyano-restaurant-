cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ========== DATA ==========
let menu = [
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

// ========== USERS ==========
const users = [
    { id: 1, username: "admin", password: "admin123", role: "admin", name: "Admin" },
    { id: 2, username: "waiter", password: "waiter123", role: "waiter", name: "Waiter" },
    { id: 3, username: "chef", password: "chef123", role: "chef", name: "Chef" }
];

// Store active sessions
let sessions = {};

// ========== AUTH APIs ==========
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessions[token] = {
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date()
        };
        
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Invalid username or password' 
        });
    }
});

app.post('/api/logout', (req, res) => {
    const { token } = req.body;
    if (token && sessions[token]) {
        delete sessions[token];
    }
    res.json({ success: true });
});

app.post('/api/verify', (req, res) => {
    const { token } = req.body;
    if (token && sessions[token]) {
        const session = sessions[token];
        res.json({
            success: true,
            user: {
                id: session.userId,
                username: session.username,
                role: session.role,
                name: session.name
            }
        });
    } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
    }
});

// ========== MENU APIs ==========
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

app.put('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = menu.findIndex(item => item.id === id);
    if (index !== -1) {
        menu[index] = { ...menu[index], ...req.body };
        res.json({ success: true, item: menu[index] });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.delete('/api/menu/:id', (req, res) => {
    const id = parseInt(req.params.id);
    menu = menu.filter(item => item.id !== id);
    res.json({ success: true });
});

// ========== ORDER APIs ==========
app.post('/api/order', (req, res) => {
    const { customerName, phone, items, total, specialInstructions } = req.body;
    const order = {
        id: orderId++,
        customerName,
        phone,
        items,
        total: parseFloat(total),
        specialInstructions: specialInstructions || '',
        status: 'pending', // pending → preparing → ready → served
        timestamp: new Date().toISOString(),
        tableNumber: req.body.tableNumber || '1'
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
    // Sort by newest first
    filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(filteredOrders);
});

app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id));
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.put('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = req.body.status || order.status;
        order.tableNumber = req.body.tableNumber || order.tableNumber;
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

// ========== STATISTICS ==========
app.get('/api/stats', (req, res) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const servedOrders = orders.filter(o => o.status === 'served').length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    res.json({
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        servedOrders,
        totalRevenue,
        menuItems: menu.length
    });
});

app.listen(PORT, () => {
    console.log(`🍽️ King Weliyano Restaurant Server running on port ${PORT}`);
    console.log(`👥 Users: admin, waiter, chef`);
});
EOF