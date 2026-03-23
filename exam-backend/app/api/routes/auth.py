from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user_id: str
    email: str
    message: str


@router.post("/login", response_model=AuthResponse)
def login(request: AuthRequest, db: Session = Depends(get_db)):
    """Authenticates the user, or creates an account if it doesn't exist yet."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Create user automatically for seamless onboarding (Open Registration)
        user = User(email=request.email, password=request.password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return AuthResponse(
            user_id=user.id, 
            email=user.email, 
            message="Account securely generated."
        )

    if user.password != request.password:
        raise HTTPException(status_code=401, detail="Invalid password.")
        
    return AuthResponse(
        user_id=user.id, 
        email=user.email, 
        message="Authenticated successfully."
    )
