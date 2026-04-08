import psycopg2
conn = psycopg2.connect("postgresql://postgres:RurRubhiXprNjGcj@db.rpulvhlnukocprueiavd.supabase.co:5432/postgres")
cur = conn.cursor()
cur.execute("ALTER TABLE public.store_purchases ALTER COLUMN item_id TYPE TEXT;")
conn.commit()
print("Successfully changed item_id type to TEXT")
