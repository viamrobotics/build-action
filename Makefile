dist/index.js: src/index.js
	npm install -g @vercel/ncc
	ncc build $^
