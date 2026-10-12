import os
import sys
import time
import hmac
import hashlib
import base64
import json
import sqlite3
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, Depends, Header

# Database initialization
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "users.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Secret key for JWT simulation (HMAC SHA-256)
JWT_SECRET = os.environ.get("AEGIS_JWT_SECRET", "aegisdrive_secret_token_key_2026_super_secure")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'analyst',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Password hashing utilities using standard library hashlib
def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return dk.hex(), salt

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    hashed, _ = hash_password(password, salt)
    return hmac.compare_digest(hashed, password_hash)

# JWT generation and validation without external dependency
def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def create_jwt_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    seg1 = base64url_encode(header_bytes)
    seg2 = base64url_encode(payload_bytes)
    signing_input = f"{seg1}.{seg2}".encode('utf-8')
    
    sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    seg3 = base64url_encode(sig)
    return f"{seg1}.{seg2}.{seg3}"

def decode_jwt_token(token: str) -> dict:
    parts = token.split('.')
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Invalid token structure")
    
    seg1, seg2, seg3 = parts
    signing_input = f"{seg1}.{seg2}".encode('utf-8')
    expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    try:
        actual_sig = base64url_decode(seg3)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise HTTPException(status_code=401, detail="Invalid token signature")
        
        payload_bytes = base64url_decode(seg2)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        if payload.get("exp") and time.time() > payload["exp"]:
            raise HTTPException(status_code=401, detail="Token has expired")
            
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation error: {str(e)}")

# Pydantic Schemas
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "analyst"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

class AuthResponse(BaseModel):
    token: str
    user: UserResponse
    message: str

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    return decode_jwt_token(token)

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    email = req.email.strip().lower()
    pw_hash, salt = hash_password(req.password)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)",
            (email, req.name.strip(), pw_hash, salt, req.role or 'analyst')
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    
    conn.close()
    
    payload = {
        "sub": user_id,
        "email": email,
        "name": req.name.strip(),
        "role": req.role or 'analyst',
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS
    }
    token = create_jwt_token(payload)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": email,
            "role": req.role or 'analyst'
        },
        "message": "Account created successfully"
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.strip().lower()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, password_hash, salt, role FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not verify_password(req.password, row[4], row[3]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id, name, user_email, _, _, role = row
    
    payload = {
        "sub": user_id,
        "email": user_email,
        "name": name,
        "role": role,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS
    }
    token = create_jwt_token(payload)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": user_email,
            "role": role
        },
        "message": "Login successful"
    }

@router.get("/me", response_model=UserResponse)
def get_user_profile(user: dict = Depends(get_current_user)):
    return {
        "id": user["sub"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }
