# 🏥 MediConnect Frontend

MediConnect is a seamless doctor–patient consultation platform.  
This repository contains the **frontend application** built with **React + TypeScript**, following **Clean Architecture principles**.

---

## ✨ Features

### 👩‍⚕️ Patient Side
- Register & book consultation slots with online payment
- Upload medical reports (scans, lab results, prescriptions)
- Add optional symptoms during booking
- Receive consultation notifications via **Google Meet** & **WhatsApp**
- Access prescriptions by email (print-ready for pharmacy use)

### 👨‍⚕️ Doctor/Admin Side
- Dashboard to view today’s, upcoming, and past appointments
- Manage patient profiles, history, documents, and reports
- Flexible scheduling (regular + custom schedules)
- Start Google Meet directly from appointments
- Prescription management with automated patient email delivery

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript  
- **State Management:** Context API  
- **Architecture:** Clean Architecture  
  - Service Layer  
  - Context Layer  
  - Type Checkers  
  - Custom Hooks  
- **Styling:** (add your choice: Tailwind)  
- **Hosting:** Amazon EC2  

---

## 📂 Project Structure

src/

├── components/ # Reusable UI components

├── contexts/ # Global state management with Context API

├── hooks/ # Custom React hooks

├── services/ # API calls & business logic

├── types/ # TypeScript type definitions

├── pages/ # App pages (Patient, Doctor, etc.)

├── utils/ # Helper functions

└── App.tsx # Root component


---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation

### 1. Clone the repository
```bash
git clone https://github.com/Athikajishida/DoctersApp-web.git
```


### 2. Navigate into the project folder
```bash
cd mediconnect-frontend
```

### 3. Install dependencies
```bash
npm install
```
# or
```bash
yarn install
```

### 4. Running Locally
```bash
npm run dev
```
# or
```bash
yarn dev
```

🌐** Deployment**

The app is hosted on Amazon EC2.
👉 [Live Demo](http://register.cancerclinickerala.com)

📧 **Contact**
If you have any questions or suggestions:
Athika Jishida M – Ruby on Rails & React Developer
