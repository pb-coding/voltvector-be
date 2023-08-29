#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="ghcr.io"
DOCKER_USERNAME="pb-coding"
DOCKER_IMAGE_NAME="voltvector-be"
CONTAINER_NAME="voltvector-be"
TARGET_DIRECTORY="/var/www/$CONTAINER_NAME"
DOCKER_NETWORK="swag_net"
FIXED_IP="172.18.0.70"

# Authenticate with Docker registry
echo "Authenticating with Docker registry..."
docker login -u $DOCKER_USERNAME --password $GITHUB_TOKEN $DOCKER_REGISTRY

# Pull the latest Docker image
echo "Pulling the latest Docker image..."
docker pull $DOCKER_REGISTRY/$DOCKER_USERNAME/$DOCKER_IMAGE_NAME:latest

# Stop and remove the existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping and removing the existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Run the new Docker container
echo "Starting a new container from the latest image..."
docker run -d \
  --name $CONTAINER_NAME \
  --network $DOCKER_NETWORK \
  --ip $FIXED_IP \
  -v $TARGET_DIRECTORY:/app \
  $DOCKER_REGISTRY/$DOCKER_USERNAME/$DOCKER_IMAGE_NAME:latest

echo "Deployment complete."