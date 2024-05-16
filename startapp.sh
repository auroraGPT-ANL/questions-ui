#!/usr/bin/env bash

source /app/spack/share/spack/setup-env.sh
spack env activate /app/questions-ui/
source /app/questions-ui/backend/venv/bin/activate
cd /app/questions-ui/backend
uvicorn --host agpt-questions-vmw-01.cels.anl.gov --port 8080 --workers 4 backend:app --root-path "/projects/auroragptquestions"
