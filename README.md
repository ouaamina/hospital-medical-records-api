# Hospital Medical Records API (Backend)

High-performance RESTful API backend for managing hospital patient medical records, department routing, and authentication.

## Features

- **Authentication & Authorization:** Secure JWT token-based authentication with bcrypt password hashing.
- **Auth Middleware:** Protection layer securing private patient and medical service endpoints.
- **User Profile (`/me`):** Authenticated endpoint returning current user account details.
- **Patient Management:** Full CRUD REST endpoints for patient records supporting specialized departments (Cardiology, Emergency, Oncology, General).

## Tech Stack

- **Runtime & Language:** Node.js, TypeScript
- **Framework:** Restana
- **Database & Query Builder:** PostgreSQL (`pg`), Knex.js
- **Authentication:** JSON Web Tokens 
- **Testing:** Jest, Supertest, `ts-jest`

