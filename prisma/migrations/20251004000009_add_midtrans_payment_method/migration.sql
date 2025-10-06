-- Ensure the PaymentMethod enum includes the MIDTRANS value for gateway payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethod'
      AND e.enumlabel = 'MIDTRANS'
  ) THEN
    ALTER TYPE "PaymentMethod" ADD VALUE 'MIDTRANS';
  END IF;
END
$$;
