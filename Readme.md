# 🛒 Grocery Booking API – qp-assessment

A TypeScript-based RESTful API that allows **Admins** to manage groceries and **Users** to place grocery orders. Built with **Node.js**, **Express**, and **PostgreSQL**, and containerised using **Docker** for streamlined deployment.

---

## Tech Stack

- **Backend**: Node.js (v18), Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Railway)
- **Auth**: JWT
- **Containerization**: Docker
- **ORM**: Raw SQL (via pg)

---

## Features

- User Registration and Login with JWT-based Authentication
- Role-based Access Control (Admin & User)
- Add, Update, View, and Delete Grocery Items (Admin)
- Maintain and Update Inventory
- Users can view the grocery list
- Users can place multi-item grocery orders
- Orders include total cost and timestamp
- Full Docker support for containerised deployment
- Postgresql integration with Railway

---

## Schema

### Grocery
Column | Type | Constraints | Description

id | SERIAL | PRIMARY KEY | Unique identifier

name | TEXT | NOT NULL | Name of the grocery item

price | NUMERIC | NOT NULL | Price per unit

stock | INT | DEFAULT 0 | Available quantity in stock

unit | TEXT |  | Unit of measure (e.g., kg, pcs)



### Users

Column | Type | Constraints | Description

id | SERIAL | PRIMARY KEY | Unique identifier

email | TEXT | NOT NULL, UNIQUE | User email address

password | TEXT | NOT NULL | Hashed password

role | TEXT | DEFAULT 'user' CHECK(role IN ('user', 'admin')) | Role of the user (admin or user)



### Orders
Column | Type | Constraints | Description

id | SERIAL | PRIMARY KEY | Unique identifier

userId | INTEGER | REFERENCES users(id) | Foreign key referencing the user

items | JSONB | NOT NULL | List of ordered items with quantity

total_cost | NUMERIC | NOT NULL | Total cost of the order

created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order creation timestamp

---

## Environment Variables


CONNECTION_STRING=your_postgres_connection_string

CORS_ORIGIN=http://localhost:3000

CORS_METHODS=GET,POST,PUT,DELETE

TOKEN_TIME=1h

JWT_PRIVATE=your_private_key

JWT_PUBLIC=your_public_key

JWT_SECRET=your_jwt_secret

PORT=3000

---
Developed for the Fullstack Node.js position as part of the QP Assessment.
Made with Express and TypeScript.
