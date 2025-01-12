#!/bin/bash
set -e

docker compose -f ./docker/docker-compose.yaml -p colonist up -d --build --wait --remove-orphans