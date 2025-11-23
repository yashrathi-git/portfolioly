# Portfolioly Backend API

A FastAPI backend with Firebase authentication and email verification middleware.

## Schema Alignment

The backend Pydantic models in `app/schemas/portfolio.py` are aligned with the frontend TypeScript types defined in the `portfolioly-schema` package. This ensures type consistency across the entire stack:

- **Backend**: Pydantic models for validation and serialization
- **Frontend**: Zod schemas in `portfolioly-schema` package
- **Alignment**: Field names, types, and validation rules match exactly

When updating schemas, ensure changes are reflected in both:

1. Backend Pydantic models (`backend/app/schemas/portfolio.py`)
2. Frontend Zod schemas (`packages/schema/src/schemas/*.ts`)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Main FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Application settings
│   │   └── firebase.py      # Firebase initialization
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── models.py        # Authentication models
│   │   ├── middleware.py    # Auth middleware & dependencies
│   │   └── routes.py        # Auth-related routes
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── portfolio.py     # Portfolio Pydantic models
│   │   ├── auth.py          # Auth schemas
│   │   └── user_settings.py # User settings schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── portfolio.py     # Portfolio routes
│   │   ├── upload.py        # Upload routes
│   │   ├── public_portfolio.py # Public portfolio routes
│   │   └── user_settings.py # User settings routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── portfolio_service.py
│   │   ├── ai_processor.py
│   │   └── user_settings_service.py
│   └── api/
│       ├── __init__.py
│       └── routes.py        # Main API routes
├── firebaseServiceKeyJson/
│   └── firebaseServiceKey.json
├── tests/                   # Test files
├── .env
├── requirements.txt
├── run.py                   # Development server
└── main.py                  # Legacy compatibility
```

## Features

### Authentication Middleware

- **Token Verification**: Validates Firebase ID tokens
- **Email Verification Check**: Configurable email verification requirement
- **Multiple Auth Levels**:
  - `RequireAuth`: Any authenticated user
  - `RequireVerifiedEmail`: Authenticated user with verified email
- **Error Handling**: Structured error responses with error codes

### Configuration

Environment variables in `.env`:

```env
APP_NAME=Portfolioly API
DEBUG=false
FRONTEND_ORIGIN=http://localhost:3000
GOOGLE_APPLICATION_CREDENTIALS=./firebaseServiceKeyJson/firebaseServiceKey.json
REQUIRE_EMAIL_VERIFICATION=true
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"..."}
```

When you cannot mount the JSON file (for example on Azure Container Apps), flatten the service account file into a single string and place it in `FIREBASE_CREDENTIALS`:

```bash
python -c "import sys, json; print(json.dumps(json.load(sys.stdin), separators=(',', ':')))" \
  < firebaseServiceKeyJson/firebaseServiceKey.json
```

## Usage Examples

### Basic Authentication

```python
from app.auth.middleware import RequireAuth
from app.auth.models import UserToken

@router.get("/protected")
async def protected_route(user: UserToken = RequireAuth):
    return {"message": f"Hello {user.email}!"}
```

### Email Verification Required

```python
from app.auth.middleware import RequireVerifiedEmail

@router.get("/verified-only")
async def verified_route(user: UserToken = RequireVerifiedEmail):
    return {"message": "Email verified user only"}
```

### Custom Authentication Logic

```python
from app.auth.middleware import require_authenticated_user

@router.get("/custom")
async def custom_route(user: UserToken = Depends(require_authenticated_user)):
    if not user.email_verified:
        # Custom logic for unverified users
        return {"message": "Please verify your email"}
    return {"message": "Welcome verified user!"}
```

## API Endpoints

### Health & Status

- `GET /health` - Health check
- `GET /auth/me` - Current user info (auth required)
- `GET /auth/me/verified` - Verified user info (email verification required)
- `POST /auth/verify-email-status` - Check email verification status

### Protected Routes

- `GET /protected` - Basic protected route
- `GET /verified-only` - Requires email verification

## Development

### Prerequisites

This project uses `uv` as the Python package manager for faster dependency management and virtual environment handling.

Install `uv`:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with pip
pip install uv
```

### Setup

```bash
cd backend

# Create virtual environment and install dependencies with uv
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt

# Alternative: Install dependencies directly with uv (recommended)
uv pip sync requirements.txt
```

### Run Development Server

```bash
# With uv (recommended)
uv run python run.py

# Or activate venv first
source .venv/bin/activate
python run.py
```

### Run with uvicorn directly

```bash
# With uv
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or with activated venv
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Extending the Authentication System

### Adding New Authentication Levels

Create custom dependency functions in `app/auth/middleware.py`:

```python
async def require_admin_user(user: UserToken = Depends(verify_firebase_token)) -> UserToken:
    """Require admin user."""
    # Check custom claims or database for admin status
    if not user.firebase.get('admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
```

### Adding Custom User Data

Extend the `UserToken` model in `app/auth/models.py`:

```python
class UserToken(BaseModel):
    # ... existing fields ...
    is_admin: bool = False
    subscription_tier: Optional[str] = None

    @classmethod
    def from_firebase_token(cls, decoded_token: Dict[str, Any]) -> "UserToken":
        # ... existing logic ...
        # Add custom claims or database lookups
        return cls(
            # ... existing fields ...
            is_admin=decoded_token.get('admin', False),
            subscription_tier=decoded_token.get('subscription_tier')
        )
```

### Error Handling

The system provides structured error responses:

```json
{
  "detail": "Email verification required to access this resource",
  "error_code": "EMAIL_NOT_VERIFIED",
  "requires_verification": true
}
```

## Security Best Practices

1. **Environment Variables**: Store sensitive config in `.env`
2. **Token Validation**: All tokens are verified against Firebase
3. **CORS Configuration**: Properly configured for your frontend
4. **Error Messages**: Don't expose sensitive information
5. **Email Verification**: Configurable requirement for sensitive operations
