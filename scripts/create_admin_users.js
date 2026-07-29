const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

const adminNumbers = [
    '+91 98903 54858',
    '+91 97734 43190',
    '+91 98810 27738',
    '+91 76664 75554',
    '+91 81080 53372'
];

// The admin panel signs in with mobile + password, so an admin created without
// one cannot log in at all. Existing passwords are left alone — re-run
// scripts/set_admin_passwords.js to reset them.
const DEFAULT_ADMIN_PASSWORD = 'Qwerty@1234';

const createAdminUsers = async () => {
    try {
        await connectDB();
        console.log('Connected to database for admin creation...');

        for (const rawNumber of adminNumbers) {
            // Normalize: remove '+91' prefix (if present) and all spaces
            const mobile = rawNumber.replace(/^\+91/, '').replace(/\s+/g, '');

            if (!/^\d{10}$/.test(mobile)) {
                console.error(`Invalid mobile number format after cleaning: ${rawNumber} -> ${mobile}`);
                continue;
            }

            console.log(`Processing ${mobile}...`);

            let user = await User.findOne({ mobile }).select('+password');

            if (user) {
                console.log(`User found for ${mobile}. Updating role to admin...`);
                user.role = 'admin';
                // Ensure verified if they are being made admin manually
                if (!user.isVerified) user.isVerified = true;
                if (!user.password) {
                    user.password = DEFAULT_ADMIN_PASSWORD; // hashed by the pre-save hook
                    console.log(`Set default admin password for ${mobile}.`);
                }
                await user.save();
                console.log(`Updated ${mobile} to admin.`);
            } else {
                console.log(`User not found for ${mobile}. Creating new admin user...`);
                user = await User.create({
                    mobile,
                    role: 'admin',
                    isVerified: true,
                    name: 'Admin User', // Default name
                    password: DEFAULT_ADMIN_PASSWORD // hashed by the pre-save hook
                });
                console.log(`Created new admin user ${mobile}.`);
            }
        }

        console.log('Admin user creation/update complete.');

    } catch (error) {
        console.error('Error creating admin users:', error);
    } finally {
        await disconnectDB();
        process.exit(0);
    }
};

createAdminUsers();
