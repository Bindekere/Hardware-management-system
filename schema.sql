-- HardwareDesk PostgreSQL / Supabase Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STOREKEEPER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Storage Locations
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aisle TEXT NOT NULL,
    shelf TEXT NOT NULL,
    bin TEXT NOT NULL,
    label TEXT UNIQUE NOT NULL, -- e.g. A1-S1-B1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    total_purchased NUMERIC(12, 2) DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLEARED', 'OVERDUE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customers (Debtors & Store Credit)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    credit_balance NUMERIC(12, 2) DEFAULT 0.00,
    total_credit NUMERIC(12, 2) DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) DEFAULT 0.00,
    store_credit NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OVERDUE', 'STORE CREDIT', 'CLEARED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    category_id TEXT DEFAULT 'Building',
    supplier_id TEXT,
    storage_location_id TEXT DEFAULT 'A1-S1-B1',
    unit TEXT NOT NULL DEFAULT 'pcs',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estimated_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Mobile Money', 'Bank', 'Credit', 'Store Credit')),
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

-- 9. Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL
);

-- 11. Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('SALE', 'PURCHASE', 'RETURN', 'DAMAGE', 'LOSS', 'THEFT', 'ADJUSTMENT')),
    quantity INT NOT NULL,
    reference_id UUID,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Stock Counts & Adjustments (Blind Stock Take)
CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_count_id UUID REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    system_quantity INT NOT NULL,
    physical_quantity INT NOT NULL,
    variance INT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Damaged', 'Loss', 'Theft', 'Wrong Previous Entry', 'Unknown', 'Other', 'DAMAGE', 'LOSS', 'THEFT', 'ADJUSTMENT')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Ledger Transactions (Debtor & Creditor Audit Trail)
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('DEBTOR', 'CREDITOR', 'CUSTOMER', 'SUPPLIER')),
    type TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Receipts Record
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    type_label TEXT,
    customer_name TEXT,
    total NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Seed Categories
INSERT INTO categories (name, description) VALUES
    ('Building', 'Cement, sand, aggregates, and structural materials'),
    ('Plumbing', 'Pipes, fittings, valves, and drainage supplies'),
    ('Hardware', 'Nails, screws, bolts, fasteners, and hand tools'),
    ('Electrical', 'Cables, conduits, switches, and sockets')
ON CONFLICT (name) DO NOTHING;

-- Seed Products
INSERT INTO products (sku, barcode, name, category_id, cost_price, selling_price, stock_quantity, minimum_stock, storage_location_id) VALUES
    ('CEM-001', '8901234567890', 'Portland Cement 50kg', 'Building', 9.50, 12.00, 120, 20, 'A1-S1-B1'),
    ('PVC-002', '8901234567891', 'PVC Pipe 2 inch (3m)', 'Plumbing', 5.00, 8.50, 4, 10, 'A2-S3-B1'),
    ('NAL-003', '8901234567892', 'Steel Nails 3 inch (kg)', 'Hardware', 1.50, 2.50, 25, 15, 'A3-S1-B2')
ON CONFLICT (sku) DO NOTHING;

-- Seed Suppliers
INSERT INTO suppliers (name, phone, balance, total_purchased, amount_paid, balance_due, status) VALUES
    ('BuildPro Supplies', '+123456789', 0.00, 1200.00, 1200.00, 0.00, 'CLEARED'),
    ('Plumbing World', '+987654321', 150.00, 600.00, 450.00, 150.00, 'PENDING');

-- Seed Customers / Debtors
INSERT INTO customers (name, phone, total_credit, amount_paid, balance_due, store_credit, status) VALUES
    ('John Doe Builders', '+11223344', 350.00, 230.00, 120.00, 0.00, 'OVERDUE'),
    ('Apex Construction', '+55667788', 500.00, 170.00, 330.00, 0.00, 'PENDING'),
    ('Samuel Miller', '+77889900', 0.00, 250.00, 0.00, 150.00, 'STORE CREDIT');
