import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:RurRubhiXprNjGcj@db.rpulvhlnukocprueiavd.supabase.co:5432/postgres")
    cur = conn.cursor()
    # Add the column if it doesn't exist
    cur.execute("""
    ALTER TABLE public.task_templates 
    ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT false;
    """)
    
    # Also we should add 'template_id' to `tasks` table so we know which created task came from which daily template
    cur.execute("""
    ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS template_id UUID;
    """)
    conn.commit()
    print("Database updated successfully with is_daily and template_id")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
