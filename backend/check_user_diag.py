from repository.supabase_client import supabase
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

def check_user(username: str):
    res = supabase.table("users").select("*").ilike("username", username).execute()
    if res.data:
        for user in res.data:
            print(f"User found: ID={user.get('id')}, Username={user.get('username')}, Role={user.get('role')}")
            # Check password hash for '666888'
            target_hash = hashlib.sha256('666888'.encode()).hexdigest()
            if user.get('password') == target_hash:
                print("Password hash matches '666888'")
            else:
                print(f"Password hash mismatch. Record hash: {user.get('password')[:10]}...")
    else:
        print(f"User '{username}' not found in database.")

if __name__ == "__main__":
    check_user("Ren")
