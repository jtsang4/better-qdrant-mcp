.PHONY: clean build

clean:
	rm -rf dist

build: clean
	uv build
