# Database Change Reflection Fix

## Goal

Ensure completed sales and stock deductions remain visible after the frontend refreshes
from the shared Supabase database.

## Design

The backend remains the source of truth. Product and sales polling responses will
explicitly bypass intermediary/browser caching. The sales endpoint will normalize
Supabase's nested `sale_items` relation to the frontend-facing `items` field.

Checkout persistence will only report success after the sale header, line items, and
stock updates succeed. Stock update failures will no longer be silently ignored.
The existing 503 response behavior will remain for unavailable or failed shared
persistence.

The frontend will:

1. Treat non-success API responses as errors.
2. Read the normalized persisted sale response for receipts.
3. Perform an immediate fresh data reload after checkout.
4. Continue the existing polling loop for multi-device synchronization without
   allowing cached responses to overwrite current state.

The active frontend source copy and its mirrored source copy will be kept consistent
so builds do not reintroduce the bug.

## Error handling

No in-memory fallback will claim a sale succeeded when Supabase persistence fails.
Backend logs will retain the underlying exception for diagnosis, while client-facing
errors will remain actionable and concise.

## Verification

- Run the existing frontend build.
- Run a Python backend compile/import check.
- If local services are available, exercise the products and sales GET/POST paths.
- Review the final diff to confirm unrelated user changes are preserved.
