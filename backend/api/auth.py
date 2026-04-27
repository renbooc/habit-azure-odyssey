from fastapi import APIRouter, HTTPException
from schema.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from service.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest):
    try:
        data = AuthService.login(request)
        return data
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest):
    try:
        data = AuthService.register(request)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    """忘记密码：验证用户是否存在，返回重置码提示"""
    try:
        data = AuthService.forgot_password(request)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    """重置密码：验证重置码并设置新密码"""
    try:
        data = AuthService.reset_password(request)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pending-resets")
def get_pending_resets(family_id: str):
    """获取家庭内待处理的重置码（家长端使用）"""
    try:
        codes = AuthService.get_family_reset_codes(family_id)
        return {"pending_resets": codes}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
