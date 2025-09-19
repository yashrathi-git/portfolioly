from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import firebase_admin
from firebase_admin import auth as admin_auth, credentials
import os
import dotenv


# Initialize Firebase Admin using env var GOOGLE_APPLICATION_CREDENTIALS or service account JSON
if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred_path = "/home/yashrathi/Documents/AA_Essential_projx/portfolioly/portfolioly-final/backend/firebaseServiceKeyJson/firebaseServiceKey.json"
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Fallback to application default credentials (useful on GCP)
        cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

app = FastAPI(title=os.getenv("APP_NAME", "Portfolioly API"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header"
        )
    token = authorization.split(" ", 1)[1]
    try:
        decoded = admin_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/protected")
async def protected(decoded=Depends(verify_token)):
    # Example protected payload
    return {
        "message": "Hello from FastAPI!",
        "uid": decoded.get("uid"),
        "email": decoded.get("email"),
        "claims": {k: v for k, v in decoded.items() if k in ("email_verified", "name")},
    }
