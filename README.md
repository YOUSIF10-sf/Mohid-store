# Smart Warehouse (M-Store) - Premium ERP System

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-black)
![License](https://img.shields.io/badge/License-Proprietary-red)

A sophisticated, cross-platform warehouse management system built with **React Native (Expo)**. Designed for speed, security, and a premium user experience across Web and Mobile devices.

## ✨ Key Features

- 📱 **Unified Experience**: Seamlessly switch between Web and Mobile with synchronized state and performance.
- 🔐 **Hardened Security**: SHA-256 password hashing for robust credential protection.
- ⚡ **Instant-Load Performance**: Virtualized lists and module-level caching for instantaneous feedback.
- 📊 **Dynamic Analytics**: Real-time charts for stock levels, replenishment needs, and withdrawal trends.
- 🖨️ **Professional Receipts**: Built-in PDF receipt generation for equipment withdrawals (pledge-based).
- ☁️ **Native Aesthetics**: Apple-inspired "Floating" UI with soft shadows and borderless modern design.

## 🛠️ Technology Stack

- **Framework**: React Native / Expo Router (v3+)
- **Styling**: Vanilla Stylesheet with dynamic platform checks.
- **Data Engine**: SQLite (Expo-SQLite) / Unified Storage Service.
- **Visuals**: Lucide Icons, Expo-Image, React Native Chart Kit.
- **Security**: Robust pure-JS SHA-256 implementation.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run on Web**:
   ```bash
   npm run web
   ```

3. **Run on Mobile (Development)**:
   ```bash
   npx expo start
   ```

## 📲 Over-the-Air (OTA) Updates

This project is configured to work with **EAS Update**, allowing you to push critical logic or UI fixes directly to user devices without needing to re-submit to App Stores.

```bash
eas update --branch production --message "Quick UI Update"
```

---
*Developed for Smart Warehouse Enterprise Solutions.*
