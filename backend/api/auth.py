from fastapi import APIRouter, HTTPException
from schema.auth import LoginRequest, RegisterRequest, AuthResponse
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
