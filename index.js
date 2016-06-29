'use strict';
const http = require('axios');
const path = 'static/';

exports.handler = (event, context, callback) => {
    const downloadsUrl = JSON.parse(event.Records[0].Sns.Message).repository.contents_url.replace('{+path}', path);
    http.get(downloadsUrl, {
      headers: {
        'User-Agent': 'AWS Lambda Function'
      }
    })
    .then((payload) => {
      callback(null, 'SIEMANKO ;]');
    })
    .catch((error) => {
      callback(error, 'Failed to get files in repository.');
    });
};
