# 🛒 Grocery Booking API – qp-assessment

A TypeScript-based RESTful API that allows **Admins** to manage groceries and **Users** to place grocery orders. Built with **Node.js**, **Express**, and **PostgreSQL**, and containerized using **Docker** for streamlined deployment.

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
- Users can view grocery list
- Users can place multi-item grocery orders
- Orders include total cost and timestamp
- Full Docker support for containerized deployment
- PostgreSQL integration with Railway

---

Environment Variables

CONNECTION_STRING=your_postgres_connection_string
CORS_ORIGIN=http://localhost:3000
CORS_METHODS=GET,POST,PUT,DELETE
TOKEN_TIME=1h
JWT_PRIVATE=your_private_key
JWT_PUBLIC=your_public_key
JWT_SECRET=your_jwt_secret
PORT=3000

Author
Developed for the Fullstack Node.js position as part of the QP Assessment.
Made with Express and TypeScript.
