include .env

genapi: downloadoa
	npx openapi-typescript openapi.gen.yaml -o ./src/schemas.ts

downloadoa:
	curl --request GET \
		--fail \
		--url 'https://api.bitbucket.org/2.0/repositories/ilya_dt/budgedoa/src/v1.0.1/openapi.yaml' \
		--header 'Authorization: Bearer $(BB_ACCESS_TOKEN)' > openapi.gen.yaml
