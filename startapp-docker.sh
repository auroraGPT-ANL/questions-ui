#!/usr/bin/bash
echo "this is a template; you likely want to tweak settings for production"

docker run -d  --name questionsui --restart=always -p 8000:8000 -v ./db:/app/db -v ./files:/app/files -e WEB_CONCURRENCY=$(nproc) ghcr.io/auroragpt-anl/questions-ui:latest
