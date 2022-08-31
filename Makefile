.ONESHELL:
OPENVINO_WORKBENCH_ROOT:=$(shell pwd)
PYTHONPATH:=${OPENVINO_WORKBENCH_ROOT}:${PYTHONPATH}

docker_up:
	LOCAL_ADDR=172.17.0.1 sudo docker-compose -f docker/docker-compose.local.yml up -d --remove-orphans
docker_down:
	sudo docker-compose -f docker/docker-compose.local.yml down

client_up:
	cd client/
	npm start &
	cd ..
client_down:
	kill -9 `lsof -t -i:4200` | true

server_up: celery_up
	${OPENVINO_WORKBENCH_ROOT}/.venv/bin/gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5675 workbench:APP --log-level DEBUG --no-sendfile --timeout 500

db_upgrade:
	${OPENVINO_WORKBENCH_ROOT}/.venv/bin/flask db upgrade

celery_up:
	PUBLIC_PORT=4200 ${OPENVINO_WORKBENCH_ROOT}/.venv/bin/celery -A wb.main.tasks.task worker --loglevel=DEBUG &

# https://gist.github.com/harshithjv/9c6499e36094d07ccf9e31d0af53ddfb
celery_down:
	kill -9 $(ps aux | grep celery | grep -v grep | awk '{print $2}' | tr '\n' ' ') | true

jupyter_up:
	jupyter lab --config "./docker/scripts/jupyter_notebook_config.py" &

jupyter_down:
	kill -9 `lsof -t -i:8888` | true

start: docker_up client_up jupyter_up server_up
	@echo "Starting Docker, Client, Jupyter, Server"

stop: client_down docker_down jupyter_down celery_down
	@echo "Stoping Client, Docker, Celery, Jupyter"
