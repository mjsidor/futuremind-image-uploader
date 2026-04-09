start:
	docker compose up -d

test-unit:
	docker compose run --rm test

test-e2e:
	docker compose run --rm test-e2e