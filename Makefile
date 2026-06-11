run:
	docker compose up

stop:
	docker compose down

mig:
	docker compose exec backend uv run python manage.py makemigrations

up:
	docker compose exec backend uv run python manage.py migrate

user:
	docker compose exec backend uv run python manage.py createsuperuser

celery:
	docker compose exec backend uv run celery -A root worker -l INFO

apps:
	python manage.py startapp apps