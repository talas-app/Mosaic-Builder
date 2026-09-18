# No build step — these targets only serve the files as they are.
# See DECISIONS.md, decision 4.

PORT ?= 8000

.PHONY: serve serve-docker

## Serve the tool at http://localhost:$(PORT). Needs nothing but Python 3.
serve:
	python3 -m http.server $(PORT)

## Same, in a container, for a machine without Python 3.
serve-docker:
	docker run --rm -it -p $(PORT):80 -v "$(CURDIR)":/usr/share/nginx/html:ro nginx:alpine
