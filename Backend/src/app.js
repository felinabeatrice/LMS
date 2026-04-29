// Add this import at the top with other requires
const adminRoutes = require('./routes/adminRoutes');

// Add this line in the routes section
app.use('/api/admin', adminRoutes);