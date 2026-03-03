"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("./middlewares/error.middleware");
// Routes imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const tournament_routes_1 = __importDefault(require("./modules/tournaments/tournament.routes"));
const registration_routes_1 = __importDefault(require("./modules/registrations/registration.routes"));
const payment_routes_1 = __importDefault(require("./modules/payments/payment.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const support_routes_1 = __importDefault(require("./modules/support/support.routes"));
const admin_support_routes_1 = __importDefault(require("./modules/admin/admin-support.routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://calloutesportsnew.vercel.app', 'https://calloutesports.com', 'https://www.calloutesports.com'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve QR images from Backend/public/qr/ at route /qr
const qrAssetsPath = path_1.default.join(__dirname, '..', 'public', 'qr');
app.use('/qr', express_1.default.static(qrAssetsPath));
// Serve uploaded images from Backend/public/uploads/ at route /uploads (local fallback)
const uploadAssetsPath = path_1.default.join(__dirname, '..', 'public', 'uploads');
app.use('/uploads', express_1.default.static(uploadAssetsPath));
// Base route
app.get('/api', (req, res) => {
    res.status(200).json({ success: true, message: 'Callout Esports API is running.' });
});
// Module Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', user_routes_1.default);
app.use('/api/tournaments', tournament_routes_1.default);
app.use('/api/registrations', registration_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/admin/analytics', analytics_routes_1.default); // Put analytics before admin so it doesn't get grabbed by admin/:id
app.use('/api/admin/support', admin_support_routes_1.default); // Admin side of new support tickets
app.use('/api/admin', admin_routes_1.default);
app.use('/api/support', support_routes_1.default); // User side of new support tickets
// Error Handling Middleware
app.use(error_middleware_1.errorHandler);
exports.default = app;
