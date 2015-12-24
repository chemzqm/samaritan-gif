build:
	@webpack public/main.js public/build/bundle.js
	@uglifyjs public/build/bundle.js > public/build/bundle.min.js

.PHONY: build
