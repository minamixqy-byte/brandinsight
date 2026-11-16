.PHONY: install seed build start test backup

install:
	scripts/bootstrap.sh

seed:
	scripts/seed.sh

build:
	scripts/build.sh

start:
	scripts/start.sh

test:
	.venv/bin/python -m pytest backend/tests -q

backup:
	scripts/backup.sh

