#!/usr/bin/bash
spack env activate .
export VITE_USE_GLOBUS="false"
export QUESTIONSUI_EVENT_PASSWORD="anllabstyle"
export QUESTIONSUI_AI_API="http://localhost:9000/v1/"
(cd ./backend/;  uvicorn --use-colors --host ::1 backend:app --reload | sed -u 's/^/BACKEND /' -) &
(export FORCE_COLOR=1; cd ./frontend; npm run dev | sed -u 's/^/FRONTEND /' -) &
wait
