// ============================================================
// WAITER MANAGEMENT - ADMIN ONLY
// ============================================================

// Get all users (admin only)
app.get('/api/users', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Return users without passwords
    const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role
    }));
    res.json(safeUsers);
});

// Add new waiter (admin only)
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

    // Check if username already exists
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

// Delete waiter (admin only)
app.delete('/api/users/:id', (req, res) => {
    const token = req.headers.authorization;
    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (sessions[token].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    
    // Prevent deleting admin or chef
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

// Reset waiter password (admin only)
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
