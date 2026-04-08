import os
from dotenv import load_dotenv

load_dotenv()
from repository.supabase_client import supabase

res = supabase.table("tasks").select("family_id, username, completed").eq("family_id", "test_family").execute()
tasks = res.data or []
print("Tasks for test_family:", len(tasks))

res = supabase.table("tasks").select("family_id, username, completed").execute()
tasks = res.data or []
print("Total tasks everywhere:", len(tasks))

from collections import Counter
print("Completed by family_id:", Counter(t["family_id"] for t in tasks if t["completed"]))
print("Completed by family_id+username:", Counter(f"{t['family_id']} - {t['username']}" for t in tasks if t["completed"]))
