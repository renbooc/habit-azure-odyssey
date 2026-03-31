import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:RurRubhiXprNjGcj@db.rpulvhlnukocprueiavd.supabase.co:5432/postgres")
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS public.task_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 10,
        icon TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Insert some default presets if empty
    INSERT INTO public.task_templates (title, points, icon)
    SELECT '收拾玩具', 20, 'Puzzle'
    WHERE NOT EXISTS (SELECT 1 FROM public.task_templates);
    
    INSERT INTO public.task_templates (title, points, icon)
    SELECT '阅读半小时', 15, 'BookOpen'
    WHERE NOT EXISTS (SELECT 1 FROM public.task_templates WHERE title = '阅读半小时');
    """)
    conn.commit()
    print("Table task_templates created successfully")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
