# SolBeacon - Proximity-Based Solana Payments

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![Built for Colosseum Hackathon](https://img.shields.io/badge/Built%20for-Colosseum%20Hackathon-blue)](https://www.colosseum.org/breakout)

## 📱 Demo

[![SolBeacon Demo Video](https://img.shields.io/badge/Watch-Demo%20Video-red)](https://www.youtube.com/watch?v=YOUR_DEMO_VIDEO_ID)

## 🎯 Pitch Deck

[![SolBeacon Pitch Deck](https://img.shields.io/badge/View-Pitch%20Deck-blue)](https://www.loom.com/share/df328e6354ca4f199dc361da8149bc7a?sid=17cfbf7f-bf8b-471a-987d-90e35479d771)

## 🚀 Overview

SolBeacon is a revolutionary payment solution that combines MPC with iBeacon technology to enable seamless, proximity-based transactions on the Solana blockchain. Built during the Colosseum Hackathon, this project demonstrates the future of contactless payments through secure, decentralized technology.

## ✨ Key Features

- **Proximity-Based Payments**: Automatically trigger transactions when users are in range of iBeacon devices
- **MPC Wallet Integration**: Enhanced security through distributed key management
- **Smart Contract Integration**: Conditional payment logic based on proximity events
- **Cross-Platform Support**:
  - Web application for merchants and users
  - iOS mobile app for consumers
  - Backend API for transaction processing
- **Real-time Transaction Monitoring**: Track payment status and proximity events
- **Secure Authentication**: JWT-based authentication with secure token storage

## 🏗️ Architecture

The project consists of three main components:

### 1\. Frontend (Solana-frontend)

- React-based web application
- Web3Auth integration for wallet management
- Real-time transaction monitoring
- Responsive design for all devices

### 2\. Backend

- Node.js/Express server
- MongoDB database
- Swagger API documentation
- JWT authentication
- Solana blockchain integration

### 3\. Mobile App (iOS)

- SwiftUI-based iOS application
- iBeacon detection and ranging
- Secure keychain storage
- Real-time proximity monitoring
- Push notification support

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Xcode 15+ (for iOS development)
- iOS device with Bluetooth capabilities (for testing iBeacon)

### Backend Setup

1.  Navigate to the backend directory:

```
cd backend
```

1.  Install dependencies:

```
npm install
```

1.  Create a `.env` file with your configuration:

```
MONGODB_URI=
API_URL=
PAYMASTER_PRIVATE_KEY=
FRONTEND_URL=
JWT_SECRET=
```

1.  Start the server:

```
npm run dev
```

1.  Access Swagger documentation at:

```
http://localhost:3000/api-docs/
```

### Frontend Setup

1.  Navigate to the Solana frontend directory:

```
cd Solana-frontend
```

1.  Install dependencies:

```
npm install
```

1.  Start the development server:

```
npm run dev
```

1.  Access the application at:

```
http://localhost:5174/
```

### iOS App Setup

1.  Open the `mobile/iBeacon.xcodeproj` in Xcode
2.  Configure your development team and signing certificate
3.  Build and run on your iOS device

## 🔒 Security Features

- MPC (Multi-Party Computation) wallet implementation
- Secure key storage using iOS Keychain
- JWT-based authentication
- Encrypted communication
- Proximity-based transaction validation

---

Built with ❤️ during the Colosseum Hackathon
