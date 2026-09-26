# stocksense-inventory-management
A modular Inventory Management System for managing products, stock, receipts, deliveries, internal transfers, and inventory adjustments.
# StockSense — Inventory Management System

StockSense is a full-stack Inventory Management System designed to simplify and centralize inventory operations across products, warehouses, receipts, deliveries, internal transfers, adjustments, and stock movements.

The system connects the complete inventory workflow in one place and keeps stock quantities synchronized with inventory transactions.

---

## 🚀 Features

### 📊 Dashboard

- View overall inventory information
- Monitor total stock
- Identify low-stock products
- View receipt activity
- View delivery activity
- Access major inventory operations from one dashboard

### 📦 Product Management

- Create products
- Store product name, SKU, category, and unit
- Configure reorder levels
- Track current stock quantity

### 📥 Receipts

- Record incoming stock
- Automatically increase product stock
- Maintain receipt transaction information

### 📤 Deliveries

- Record outgoing stock
- Automatically decrease product stock
- Validate available stock before processing deliveries

### 🔄 Internal Transfers

- Transfer stock between warehouse locations
- Select source and destination locations
- Validate available stock at the source
- Decrease stock from the source location
- Increase stock at the destination location
- Maintain transfer history
- Keep total inventory unchanged during transfers

### 🛠️ Stock Adjustments

- Increase or decrease stock manually
- Correct differences between physical and system stock
- Record adjustment movements

### 📖 Stock Ledger

- Track inventory movements
- Maintain transaction history
- Provide stock movement traceability
- View receipts, deliveries, transfers, and adjustments

### 🔐 Authentication

- User signup
- User login
- Secure password hashing
- Password reset using OTP workflow
- Authenticated access to the inventory dashboard

---

# 🏗️ System Architecture

StockSense follows a simple full-stack architecture:

```text
┌─────────────────────────────┐
│          Frontend           │
│       HTML / CSS / JS       │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│           Backend           │
│       Node.js / Express     │
│                             │
│ Routes → Controllers → DB   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│         PostgreSQL          │
│      Inventory Database      │
└─────────────────────────────┘

🛠️ Technology Stack
Frontend
HTML5
CSS3
JavaScript
Fetch API
Backend
Node.js
Express.js
REST APIs
CORS
Database
PostgreSQL
Authentication
Node.js Crypto
Token-based authentication
OTP-based password reset workflow
Development Tools
Git
GitHub
Visual Studio Code
pgAdmin
📁 Project Structure
stocksense-inventory-management/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── api.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── products.controller.js
│   │   │   ├── receipts.controller.js
│   │   │   ├── deliveries.controller.js
│   │   │   ├── adjustments.controller.js
│   │   │   ├── transfers.controller.js
│   │   │   ├── ledger.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   └── auth.controller.js
│   │   │
│   │   └── routes/
│   │       ├── products.routes.js
│   │       ├── receipts.routes.js
│   │       ├── deliveries.routes.js
│   │       ├── adjustments.routes.js
│   │       ├── transfers.routes.js
│   │       ├── ledger.routes.js
│   │       ├── dashboard.routes.js
│   │       └── auth.routes.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
📄 File Responsibilities
Frontend
index.html

Contains the main HTML structure of the StockSense application, including:

Sidebar
Navigation
Main content area
Top navigation
Footer
Toast notification container

The page content is dynamically rendered by app.js.

style.css

Contains the complete frontend styling, including:

Dashboard layout
Sidebar
Navigation
Cards
Forms
Buttons
Tables
Inventory movement components
Alerts
Authentication screens
Responsive layout
app.js

Contains the main frontend application logic.

It handles:

Application state
Navigation
Dashboard rendering
Product management UI
Receipt UI
Delivery UI
Transfer UI
Adjustment UI
Ledger UI
Authentication UI
Login
Signup
Password reset flow
Logout
User profile information
api.js

Acts as the frontend API layer.

It centralizes communication between the frontend and backend.

It provides API methods for:

Products
Receipts
Deliveries
Adjustments
Transfers
Ledger
Dashboard
Authentication
Backend
server.js

The main entry point of the backend.

It:

Creates the Express application
Enables CORS
Enables JSON request parsing
Registers API routes
Starts the backend server

The backend runs on:

http://localhost:5000
config/db.js

Contains the PostgreSQL database connection configuration.

The database credentials are loaded from environment variables.

controllers/

Controllers contain the business logic for each part of the inventory system.

products.controller.js

Handles:

Fetching products
Creating products
Initializing stock
receipts.controller.js

Handles incoming inventory and increases stock quantities.

deliveries.controller.js

Handles outgoing inventory and decreases stock quantities.

adjustments.controller.js

Handles manual stock increases and decreases.

transfers.controller.js

Handles internal warehouse transfers.

The transfer process:

Source Location
      │
      │ quantity -
      ▼
   Transfer
      │
      │ quantity +
      ▼
Destination Location

The backend checks source stock before completing the transfer.

ledger.controller.js

Handles stock movement history and ledger information.

dashboard.controller.js

Provides inventory information required by the dashboard.

auth.controller.js

Handles:

Signup
Login
Logout
Forgot password
OTP verification
Password reset

Passwords are hashed before being stored in the database.

🔌 API Structure
Products
GET  /api/products
POST /api/products
Receipts
POST /api/receipts
Deliveries
POST /api/deliveries
Adjustments
POST /api/adjustments
Transfers
GET  /api/transfers
POST /api/transfers
Ledger
GET /api/ledger
Dashboard
GET /api/dashboard
Authentication
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
🔄 Inventory Workflow

The main inventory workflow is:

             ┌───────────┐
             │  Product  │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │  Receipt  │
             └─────┬─────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Stock Increase │
          └────────┬────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Internal Transfer│
          └────────┬─────────┘
                   │
                   ▼
             ┌───────────┐
             │ Delivery  │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │Adjustment │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │  Ledger   │
             └───────────┘
📦 Product Management

A product contains information such as:

Product name
SKU
Category
Unit
Reorder level
Current stock quantity

When a new product is created, its initial stock quantity is initialized.

📥 Receipt Flow

A receipt represents incoming inventory.

For example:

Current Stock = 50

Receipt = +20

New Stock = 70

When the receipt is processed, the backend updates the corresponding stock record.

📤 Delivery Flow

A delivery represents outgoing inventory.

For example:

Current Stock = 70

Delivery = -20

New Stock = 50

The backend checks available stock before completing the operation.

🔄 Transfer Flow

Internal transfers allow inventory to move between locations.

For example:

Warehouse A = 100
Warehouse B = 50

Transfer 20 units from A → B

Warehouse A = 80
Warehouse B = 70

The total stock remains:

80 + 70 = 150

Before processing the transfer, the backend verifies that the source location has sufficient stock.

🛠️ Adjustment Flow

Adjustments are used when the actual physical inventory differs from the quantity stored in the system.

Example:

System Stock = 50
Physical Stock = 45

Adjustment = -5

Updated Stock = 45

Adjustments are recorded as stock movements for traceability.

📖 Stock Ledger

The Stock Ledger provides a history of inventory movements.

It helps answer questions such as:

When did stock change?
What type of movement occurred?
Which product was affected?
How much stock was moved?

The ledger can contain movements such as:

Receipt
Delivery
Transfer
Adjustment

This provides better visibility into the inventory lifecycle.

🔐 Authentication

StockSense includes an authentication flow.

Signup
User
  │
  ▼
Signup
  │
  ▼
Account Created
Login
User
  │
  ▼
Login
  │
  ▼
Credentials Verified
  │
  ▼
Authentication Token
  │
  ▼
Inventory Dashboard
Password Reset
Forgot Password
      │
      ▼
Request OTP
      │
      ▼
Verify OTP
      │
      ▼
Set New Password
      │
      ▼
Login

Passwords are hashed before being stored in PostgreSQL.

🗄️ Database

StockSense uses PostgreSQL as its primary database.

The database contains data for areas such as:

Users
Products
Stock
Locations
Location-wise stock
Receipts
Deliveries
Adjustments
Stock transfers
Stock ledger entries

PostgreSQL acts as the source of truth for inventory data.