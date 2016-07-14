'use strict';

const http = require('http');
const basename = require('path').basename;

function notify({
	address = '::1',
	port = process.env.NVB_PORT || 6786,
	name = process.env.NVB_NAME || process.argv[2] || basename(process.argv[1], '.js'),
	timeout = Number(process.env.NVB_TIMEOUT) || 10000,
	prefix = '',
	token = process.env.NVB_TOKEN || ''
} = {}) {
	return new Promise(function(fulfill, reject) {
		const request = http.request({
			hostname: address,
			port,
			method: 'POST',
			path: prefix + '/' + name,
			headers: {
				'X-NVB-Token': token
			}
		}, function({ statusCode, statusMessage }) {
			if (statusCode === 200) {
				fulfill();
			}
			else {
				const requestError = new Error(statusMessage);
				requestError.statusCode = statusCode;
				reject(requestError);
			}
		});
		request.setTimeout(timeout, reject);
		request.on('error', reject);
		request.end();
	});
}

module.exports = notify;
