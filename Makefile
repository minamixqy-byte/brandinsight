.PHONY: install seed build start test backup

install:
	bash scripts/bootstrap.sh

seed:
	bash scripts/seed.sh

build:
	bash scripts/build.sh

start:
	bash scripts/start.sh

test:
	.venv/bin/python -m pytest backend/tests -q

backup:
	bash scripts/backup.sh

