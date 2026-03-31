import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:RurRubhiXprNjGcj@db.rpulvhlnukocprueiavd.supabase.co:5432/postgres")
    cur = conn.cursor()
    # Add columns to task_templates
    cur.execute("""
    ALTER TABLE public.task_templates 
    ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'checkbox',
    ADD COLUMN IF NOT EXISTS target_duration INTEGER DEFAULT 0;
    """)
    
    # Add columns to tasks
    cur.execute("""
    ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'checkbox',
    ADD COLUMN IF NOT EXISTS target_duration INTEGER DEFAULT 0;
    """)
    
    conn.commit()
    print("Database updated successfully with task_type and target_duration")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
