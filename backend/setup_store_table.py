import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:RurRubhiXprNjGcj@db.rpulvhlnukocprueiavd.supabase.co:5432/postgres")
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS public.store_purchases (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        item_id UUID,
        price INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """)
    conn.commit()
    print("Table created successfully")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
