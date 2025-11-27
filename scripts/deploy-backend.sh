#!/bin/bash
# Deploy Backend (FastAPI) to Azure Container Apps
#
# This script builds the Python backend using ACR Tasks and deploys to Container Apps.
# Runtime environment variables are configured in Azure Container Apps, not baked into the image.
#
# Best Practices Implemented:
# - ACR Tasks for consistent cloud builds (no local Docker cache issues)
# - Image tagging with git SHA for traceability
# - Forced new revision to ensure fresh image pull
# - Health check after deployment
# - Graceful error handling
#
# Prerequisites:
# - Azure CLI logged in (az login)
# - Access to portfoliolyacr registry
#
# Usage:
#   ./scripts/deploy-backend.sh [--skip-build]

set -e

# Configuration
REGISTRY="portfoliolyacr"
IMAGE_NAME="portfolioly-backend"
RESOURCE_GROUP="portfolioly"
CONTAINER_APP_NAME="portfolioly-backend"
DOCKERFILE="backend/Dockerfile"
PRODUCTION_URL="https://api.portfolioly.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Portfolioly Backend Deployment ===${NC}"

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

# Deploy to Container Apps with forced new revision
echo -e "${YELLOW}Deploying to Container Apps...${NC}"

REVISION_SUFFIX="deploy-$(date +%s)"

az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "${REGISTRY}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}" \
    --revision-suffix "$REVISION_SUFFIX"

echo -e "${GREEN}✓ Deployment initiated${NC}"
echo -e "  Revision: ${CONTAINER_APP_NAME}--${REVISION_SUFFIX}"

# Wait for revision to be ready
echo -e "${YELLOW}Waiting for revision to be ready (20s)...${NC}"
sleep 20

# Check revision health
HEALTH_STATE=$(az containerapp revision show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --revision "${CONTAINER_APP_NAME}--${REVISION_SUFFIX}" \
    --query "properties.healthState" \
    --output tsv 2>/dev/null || echo "Unknown")

if [ "$HEALTH_STATE" == "Healthy" ]; then
    echo -e "${GREEN}✓ Revision is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Revision health state: ${HEALTH_STATE}${NC}"
fi

# Health check on production URL
echo -e "${YELLOW}Checking production URL: ${PRODUCTION_URL}/health${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/health" --max-time 10 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "  Production URL: ${PRODUCTION_URL} (HTTP ${HTTP_STATUS})"
    echo -e "  Image: ${REGISTRY}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"
elif [ "$HTTP_STATUS" == "000" ]; then
    echo -e "${YELLOW}⚠ Could not reach ${PRODUCTION_URL}${NC}"
    echo "The app may still be starting. Check Azure Portal for logs."
else
    echo -e "${YELLOW}⚠ Health endpoint returned HTTP ${HTTP_STATUS}${NC}"
    echo "Check Azure Portal for deployment logs if issues persist."
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
