from repository.supabase_client import supabase

def check_ren_password():
    try:
        res = supabase.table("users").select("username, password").eq("username", "Ren").execute()
        if res.data:
            user_info = res.data[0]
            print(f"探险通行证名: {user_info['username']}")
            print(f"当前动力密码: {user_info['password']}")
        else:
            print("未找到名为 Ren 的探险成员")
    except Exception as e:
        print(f"读取失败: {str(e)}")

if __name__ == "__main__":
    check_ren_password()
