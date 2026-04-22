#!/bin/bash
# Cloud Run Build & Deploy Script (Local Build)
# Este script faz build local das imagens e as pusha para Container Registry

set -e

# ============================================
# CONFIGURATION
# ============================================
PROJECT_ID="${1:-YOUR_PROJECT_ID}"
REGION="${2:-us-central1}"
VERSION="${3:-v1.0.0}"
DOMAIN="${4:-your-domain.com}"

if [ "$PROJECT_ID" = "YOUR_PROJECT_ID" ]; then
  echo "❌ Erro: Defina PROJECT_ID como argumento"
  echo "Uso: ./scripts/cloud-run-build.sh PROJECT_ID [REGION] [VERSION] [DOMAIN]"
  echo ""
  echo "Exemplos:"
  echo "  ./scripts/cloud-run-build.sh meu-projeto-gcp"
  echo "  ./scripts/cloud-run-build.sh meu-projeto-gcp us-central1 v1.0.0 terceirogestor.com.br"
  exit 1
fi

echo "🚀 Cloud Run Build & Deploy Script"
echo "=================================="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Version:  $VERSION"
echo "Domain:   $DOMAIN"
echo ""

# ============================================
# STEP 1: Configure gcloud
# ============================================
echo "1️⃣  Configurando gcloud..."
gcloud config set project $PROJECT_ID
gcloud auth configure-docker gcr.io

# ============================================
# STEP 2: Build Backend Image
# ============================================
echo ""
echo "2️⃣  Building backend image..."
docker build backend \
  -t gcr.io/$PROJECT_ID/terceirogestor-backend:latest \
  -t gcr.io/$PROJECT_ID/terceirogestor-backend:$VERSION \
  -f backend/Dockerfile

echo "✅ Backend image built"

# ============================================
# STEP 3: Build Frontend Image
# ============================================
echo ""
echo "3️⃣  Building frontend image..."
docker build frontend \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  -t gcr.io/$PROJECT_ID/terceirogestor-frontend:latest \
  -t gcr.io/$PROJECT_ID/terceirogestor-frontend:$VERSION \
  -f frontend/Dockerfile

echo "✅ Frontend image built"

# ============================================
# STEP 4: Push Images
# ============================================
echo ""
echo "4️⃣  Pushing images to Container Registry..."
docker push gcr.io/$PROJECT_ID/terceirogestor-backend:latest
docker push gcr.io/$PROJECT_ID/terceirogestor-backend:$VERSION
docker push gcr.io/$PROJECT_ID/terceirogestor-frontend:latest
docker push gcr.io/$PROJECT_ID/terceirogestor-frontend:$VERSION

echo "✅ Images pushed"

# ============================================
# STEP 5: Deploy Backend
# ============================================
echo ""
echo "5️⃣  Deploying backend to Cloud Run..."

gcloud run deploy terceirogestor-backend \
  --image gcr.io/$PROJECT_ID/terceirogestor-backend:$VERSION \
  --platform managed \
  --region $REGION \
  --no-allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 100 \
  --port 8080 \
  --set-env-vars \
    NODE_ENV=production,\
    APP_NAME='Terceiro Gestor',\
    GCP_PROJECT_ID=$PROJECT_ID,\
    GCP_BUCKET_NAME=terceirogestor-uploads-prod,\
    WEB_URL=https://$DOMAIN

echo "✅ Backend deployed"

# ============================================
# STEP 6: Deploy Frontend
# ============================================
echo ""
echo "6️⃣  Deploying frontend to Cloud Run..."

gcloud run deploy terceirogestor-frontend \
  --image gcr.io/$PROJECT_ID/terceirogestor-frontend:$VERSION \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 50 \
  --port 3000 \
  --set-env-vars \
    NODE_ENV=production,\
    NEXT_PUBLIC_API_URL=/api

echo "✅ Frontend deployed"

# ============================================
# STEP 7: Print URLs
# ============================================
echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="

BACKEND_URL=$(gcloud run services describe terceirogestor-backend \
  --region $REGION \
  --format='value(status.url)')

FRONTEND_URL=$(gcloud run services describe terceirogestor-frontend \
  --region $REGION \
  --format='value(status.url)')

echo ""
echo "🔗 URLs:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "📋 Próximos passos:"
echo "  1. Configurar Cloud SQL"
echo "  2. Configurar Cloud Storage bucket"
echo "  3. Configurar HTTPS Load Balancer (apex domain)"
echo "  4. Executar db migrations:"
echo "     gcloud run jobs create db-migrate --image=$BACKEND_IMAGE"
echo ""
echo "📚 Documentação:"
echo "  CLOUD-RUN-DEPLOYMENT.md"
echo ""
