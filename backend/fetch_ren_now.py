import os
from dotenv import load_dotenv
load_dotenv() # 手动加载环境

from repository.supabase_client import supabase

def find_ren_pass():
    res = supabase.table("users").select("password").eq("username", "Ren").execute()
    if res.data:
        print(f"Ren 现在的明文由于由于密码是: {res.data[0]['password']}")
    else:
        print("没找到 Ren")

if __name__ == "__main__":
    find_ren_pass()
