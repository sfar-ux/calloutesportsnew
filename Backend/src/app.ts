import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';

// Routes imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import tournamentRoutes from './modules/tournaments/tournament.routes';
import registrationRoutes from './modules/registrations/registration.routes';
import paymentRoutes from './modules/payments/payment.routes';
import adminRoutes from './modules/admin/admin.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import supportRoutes from './modules/support/support.routes';
import adminSupportRoutes from './modules/admin/admin-support.routes';

const app: Application = express();

// Middlewares
app.use(cors({
    origin: ['http://localhost:3000', 'https://calloutesportsnew.vercel.app', 'https://calloutesports.com', 'https://www.calloutesports.com'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve QR images from Backend/public/qr/ at route /qr
const qrAssetsPath = path.join(__dirname, '..', 'public', 'qr');
app.use('/qr', express.static(qrAssetsPath));

// Serve uploaded images from Backend/public/uploads/ at route /uploads (local fallback)
const uploadAssetsPath = path.join(__dirname, '..', 'public', 'uploads');
app.use('/uploads', express.static(uploadAssetsPath));

// Base route
app.get('/api', (req, res) => {
    res.status(200).json({ success: true, message: 'Callout Esports API is running.' });
});

// Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/analytics', analyticsRoutes); // Put analytics before admin so it doesn't get grabbed by admin/:id
app.use('/api/admin/support', adminSupportRoutes); // Admin side of new support tickets
app.use('/api/admin', adminRoutes);

app.use('/api/support', supportRoutes); // User side of new support tickets

// Error Handling Middleware
app.use(errorHandler);

export default app;
