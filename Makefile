dist/index.js: src/index.js
	node_modules/.bin/ncc build $^ --target es2020
