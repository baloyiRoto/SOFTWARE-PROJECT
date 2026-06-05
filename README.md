# 🎓 StudentHub
 
> A dual-module student lifestyle management web application built with React.
 
🌐 **Live Demo:** [studenthub-spendwise.netlify.app](https://studenthub-spendwise.netlify.app/)
 
StudentHub helps students take control of their finances and meals through two integrated modules: **SpendSmart** for expense and budget tracking, and **MealMate** for food inventory and recipe planning.
 
---
 
## 📌 Overview
 
Managing money and meals are two of the biggest daily challenges for students. StudentHub brings both into a single platform with role-based access so that admins can monitor trends across all users while individual students manage their own data privately.
 
---
 
## ✨ Features
 
### 💸 SpendSmart Module
- Track personal expenses by category
- Set and monitor budgets
- Generate and export PDF financial reports
- Admin dashboard with spending trends across all users
### 🍽️ MealMate Module
- Manage a personal food inventory
- Generate recipe suggestions based on available ingredients
- Get smart shopping list recommendations
### 🔐 Authentication & Access Control
- User registration and login with hashed passwords
- Role-based routing — admin users see a different interface than regular users
- Protected routes prevent unauthorized access
---
 
## 🛠️ Tech Stack
 
| Technology | Purpose |
|---|---|
| React 19 | Frontend UI framework |
| React Router v7 | Client-side routing |
| jsPDF + AutoTable | PDF report generation |
| Context API | Global auth state management |
| CSS (custom) | Styling and responsive layout |
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js (v16 or higher)
- npm
### Installation
 
```bash
# Clone the repository
git clone https://github.com/Lesego-Mowaisi/SOFTWARE-PROJECT.git
cd SOFTWARE-PROJECT
 
# Install dependencies
npm install
 
# Start the development server
npm start
```
 
The app will open at [http://localhost:3000](http://localhost:3000).
 
> Or skip setup entirely and use the **[live deployed version](https://studenthub-spendwise.netlify.app/)**.
 
### Test Credentials
 
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | `alice` | `password` |
 
> **Note:** This project currently uses mock data (`src/data/mockData.js`). No backend or database setup is required.
 
---
 
## 📁 Project Structure
 
```
src/
├── context/
│   ├── AuthContext.js        # Global authentication state
│   └── ProtectedRoute.js     # Route guard component
├── data/
│   └── mockData.js           # Mock users, expenses, budgets
├── pages/
│   ├── Login.js / Register.js
│   ├── Dashboard.js
│   ├── Expenses.js           # SpendSmart: expense CRUD
│   ├── Budgets.js            # SpendSmart: budget management
│   ├── Categories.js         # SpendSmart: category management
│   ├── Reports.js            # SpendSmart: PDF reports
│   ├── AdminTrends.js        # Admin-only analytics
│   ├── Inventory.js          # MealMate: food inventory
│   ├── RecipeGenerator.js    # MealMate: recipe suggestions
│   └── ShoppingSuggestions.js# MealMate: shopping list
├── auth.js                   # Password hashing utility
├── App.js                    # Root component and routing
└── App.css                   # Global styles
```
---
 
## 👤 Contributions
 
****
| Team Member | GitHub |
|---|---|
| Kgomo MJ | [@mapk6-apl](https://github.com/mapk6-apl) |
| Baloyi R | [@baloyiRoto](https://github.com/baloyiRoto) |
| Matabene KT | [@KatXPanda](https://github.com/KatXPanda) |
| Motileng BH | [@Boipelo-85](https://github.com/Boipelo-85) |
| Mowaisi LT | [@Lesego-Mowaisi](https://github.com/Lesego-Mowaisi) |

---
 
## 📄 License
 
This project was developed as a final-year software engineering project. All rights reserved.
