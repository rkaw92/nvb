'use strict';

const http = require('http');
const url = require('url');

function handleError(response, error) {
	// Propagate the HTTP status code from the error, but default to error 400 (bad request):
	response.statusCode = error.statusCode || 400;
	response.statusMessage = error.message;
	response.setHeader('Content-Type', 'application/json; charset=utf-8');
	response.end(JSON.stringify({
		error: {
			code: error.code,
			message: error.message
		}
	}) + '\n');
}

function handleSuccess(response) {
	response.setHeader('Content-Type', 'application/json; charset=utf-8');
	response.end(JSON.stringify({
		result: true
	}) + '\n');
}

function listen({
	address = '::',
	port = process.env.NVB_PORT || 6786,
	parts = process.argv.slice(2),
	token = process.env.NVB_TOKEN,
	timeout = process.env.NVB_TIMEOUT || 60000
} = {}) {
	let remainingParts = parts.slice();
	let trigger;
	const completionPromise = new Promise((function(fulfill) {
		trigger = fulfill;
	}).bind(this));
	
	
	const server = http.createServer((function(request, response) {
		if (request.method !== 'POST') {
			return void handleError(response, new Error('The only supported method is POST'));
		}
		
		const { pathname } = url.parse(request.url);
		// Find the right-most component of the path that is not empty:
		const pathComponents = pathname.split('/');
		let lastComponent;
		while (!lastComponent && pathComponents.length > 0) {
			lastComponent = pathComponents.pop();
		}
		if (!lastComponent) {
			return void handleError(response, new Error('Invalid path - requests must be posted to a non-empty path where the last /-delimited component denotes the part name'));
		}
		
		if (token && request.headers['x-nvb-token'] !== token) {
			const tokenError = new Error('Token mismatch - authentication failed');
			tokenError.statusCode = 401;
			return void handleError(response, tokenError);
		}
		
		// Remove the part from the list of remaining parts, and trigger completion if this was the last one:
		if (parts.indexOf(lastComponent) >= 0) {
			remainingParts = remainingParts.filter((part) => (part !== lastComponent));
			if (remainingParts.length === 0) {
				trigger();
			}
			return void handleSuccess(response);
		}
		else {
			return void handleError(response, new Error('Unrecognized part name - can not mark as completed'));
		}
	}).bind(this));
	
	server.listen(port, address);
	return new Promise(function(fulfill, reject) {
		server.on('listening', fulfill);
		server.on('error', reject);
	}).then(function() {
		return new Promise(function(fulfill, reject) {
			completionPromise.then(fulfill);
			setTimeout(function() {
				const timeoutError = new Error('Timeout exceeded while waiting for:\n' + remainingParts.map((partName) => `- ${partName}`).join('\n'));
				timeoutError.name = 'Timeout';
				timeoutError.data = { parts: remainingParts };
				reject(timeoutError);
			}, timeout);
		});
		
	});
}

module.exports = listen;
