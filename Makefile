include .env

genapi: downloadoa
	pnpx openapi-typescript openapi.gen.yaml -o ./src/models/oaschema.ts

downloadoa:
	curl --request GET \
		--fail \
		--url 'https://api.bitbucket.org/2.0/repositories/ilya_dt/budgedoa/src/v1.1.1/openapi.yaml' \
		--header 'Authorization: Bearer $(BB_ACCESS_TOKEN)' > openapi.gen.yaml
