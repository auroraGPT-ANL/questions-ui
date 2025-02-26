#!/usr/bin/bash
spack env activate .
export QUESTIONSUI_EVENT_PASSWORD="anllabstyle"
(cd ./backend/;  uvicorn --use-colors backend:app --reload | sed -u 's/^/BACKEND /' -) &
(export FORCE_COLOR=1; cd ./frontend; npm run dev | sed -u 's/^/FRONTEND /' -) &
wait
