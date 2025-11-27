#!/bin/bash
# Deploy Frontend (apps/main) to Azure App Service
#
# This script builds the Next.js app using ACR Tasks and deploys to App Service.
# All NEXT_PUBLIC_* env vars are bundled at build time from apps/main/.env.production
#
# Best Practices Implemented:
# - ACR Tasks for consistent cloud builds (no local Docker cache issues)
# - Environment validation before build
# - Image tagging with git SHA for traceability
# - Health check after deployment
# - Graceful error handling
#
# Prerequisites:
# - Azure CLI logged in (az login)
# - Access to portfoliolyacr registry
# - apps/main/.env.production exists with production values
#
# Usage:
#   ./scripts/deploy-frontend.sh [--skip-build]

set -e

# Configuration
REGISTRY="portfoliolyacr"
IMAGE_NAME="portfolioly-main"
RESOURCE_GROUP="portfolioly-next-app"
APP_SERVICE_NAME="portfolioly-fe"
DOCKERFILE="apps/main/Dockerfile"
PRODUCTION_URL="https://portfolioly.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Portfolioly Frontend Deployment ===${NC}"

# Check if .env.production exists
if [ ! -f "apps/main/.env.production" ]; then
    echo -e "${RED}Error: apps/main/.env.production not found${NC}"
    echo "This file is required for build-time NEXT_PUBLIC_* variables."
    echo "Copy from apps/main/.env.example and fill in production values."
    exit 1
fi

# Verify required env vars are set
echo -e "${YELLOW}Checking .env.production...${NC}"
required_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_API_BASE_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" apps/main/.env.production; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required variables in .env.production:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo -e "${GREEN}✓ Environment file validated${NC}"

# Generate image tag (git SHA for traceability, fallback to timestamp)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "")
if [ -n "$GIT_SHA" ]; then
    IMAGE_TAG="$GIT_SHA"
    echo -e "${YELLOW}Using git SHA for image tag: ${IMAGE_TAG}${NC}"
else
    IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
    echo -e "${YELLOW}Using timestamp for image tag: ${IMAGE_TAG}${NC}"
fi

# Build with ACR Tasks (unless --skip-build)
if [ "$1" != "--skip-build" ]; then
    echo -e "${YELLOW}Building image with ACR Tasks...${NC}"
    echo "This uploads source to Azure and builds there (no local Docker cache issues)"

    # Build and tag with both specific tag and latest
    az acr build \
        --registry "$REGISTRY" \
        --image "${IMAGE_NAME}:${IMAGE_TAG}" \
        --image "${IMAGE_NAME}:latest" \
        --file "$DOCKERFILE" \
        .

    echo -e "${GREEN}✓ Image built and pushed to ACR${NC}"
    echo -e "  Tagged as: ${IMAGE_NAME}:${IMAGE_TAG} and ${IMAGE_NAME}:latest"
else
    echo -e "${YELLOW}Skipping build (--skip-build flag)${NC}"
    IMAGE_TAG="latest"
fi

# Deploy to App Service
echo -e "${YELLOW}Deploying to App Service...${NC}"

# Update the container image
az webapp config container set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "${REGISTRY}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${GREEN}✓ Container image updated${NC}"

# Restart to ensure fresh pull
echo -e "${YELLOW}Restarting App Service to pull fresh image...${NC}"
az webapp restart \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP"

echo -e "${GREEN}✓ App Service restarted${NC}"

# Wait and check status
echo -e "${YELLOW}Waiting for app to start (30s)...${NC}"
sleep 30

# Health check on production URL
echo -e "${YELLOW}Checking production URL: ${PRODUCTION_URL}${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" --max-time 10 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "  Production URL: ${PRODUCTION_URL} (HTTP ${HTTP_STATUS})"
    echo -e "  Image: ${REGISTRY}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"
elif [ "$HTTP_STATUS" == "000" ]; then
    echo -e "${YELLOW}⚠ Could not reach ${PRODUCTION_URL}${NC}"
    echo "The app may still be starting. Check Azure Portal for logs."
else
    echo -e "${YELLOW}⚠ Production URL returned HTTP ${HTTP_STATUS}${NC}"
    echo "Check Azure Portal for deployment logs if issues persist."
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
