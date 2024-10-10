dist/index.js: src/index.js
	npm install
	node_modules/.bin/ncc build $^ --target es2020
