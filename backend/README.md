# MoveTheBox Backend

Node.js + Express + TypeScript backend service for the MoveTheBox CRM.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```

2.  **Configure Environment**:
    The backend needs access to your PostgreSQL database.
    Edit `backend/.env` and update the `DB_PASSWORD` and `DB_HOST`.
    
    If you are using Supabase, finding the connection string:
    - Go to Supabase Dashboard -> Settings -> Database -> Connection String (Node.js/URI).
    - Extract the user, password, host, port, and database name.
    
    Example `.env`:
    ```
    PORT=3000
    DB_HOST=aws-0-us-east-1.pooler.supabase.com
    DB_PORT=6543
    DB_USER=postgres.[project-ref]
    DB_PASSWORD=[YOUR-PASSWORD]
    DB_NAME=postgres
    ```

3.  **Run Server**:
    ```bash
    npm run dev
    ```

## Features Implemented

-   **API**:
    -   `POST /api/leads`: Create/Update leads. automatically calculates **Incentives** based on products in metadata.
    -   `GET /api/leads/stats`: View aggregated incentive stats.
    -   `POST /api/products`: Manage catalog.

-   **Services**:
    -   `LeadService`: Syncs JSON metadata -> `lead_line_items` table.
    -   `ProductService`: Catalog lookup.

-   **Architecture**:
    -   Auth Middleware (Tenant Isolation).
    -   Normalized Database Schema (`schema.sql`).
