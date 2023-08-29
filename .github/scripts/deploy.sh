#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="ghcr.io"
DOCKER_USERNAME="pb-coding"
DOCKER_IMAGE_NAME="voltvector-be"
CONTAINER_NAME="voltvector-be"
TARGET_DIRECTORY="/home/pb1497/deployments/$CONTAINER_NAME"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Authenticate with Docker registry
echo "Authenticating with Docker registry..."
docker login -u $DOCKER_USERNAME --password $GITHUB_TOKEN $DOCKER_REGISTRY

# Pull the latest Docker image
echo "Pulling the latest Docker image..."
docker pull $DOCKER_REGISTRY/$DOCKER_USERNAME/$DOCKER_IMAGE_NAME:latest

cd $TARGET_DIRECTORY
docker-compose down
docker-compose pull
docker-compose up -d

echo "Deployment complete."