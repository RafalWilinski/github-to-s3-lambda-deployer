'use strict';
const http = require('axios');
const AWS = require('aws-sdk');

const path = 'static/';
const bucketName = 'rwilinski.me';

const s3 = new AWS.S3({
  params: {
    Bucket: bucketName
  }
});

const putFileToS3 = (fileObject) => new Promise((resolve, reject) => {
  http.get(fileObject.download_url)
  .then((payload) => {
    s3.putObject({
      Bucket: bucketName,
      Key: fileObject.name,
      Body: payload.data
    }, (error, data) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(data);
      }
    });
  })
  .catch((error) => {
    return reject(error);
  });
});

exports.handler = (event, context, callback) => {
    const downloadsUrl = JSON.parse(event.Records[0].Sns.Message).repository.contents_url.replace('{+path}', path);
    let processed = 0;

    const updateProgress = (totalCount) => {
      processed++;
      console.log(`Progress: ${processed} out of ${totalCount}`);
      if (processed === totalCount) {
        callback(null, 'Done!');
      }
    }

    http.get(downloadsUrl, {
      headers: {
        'User-Agent': 'AWS Lambda Function' // Without that Github will reject all requests
      }
    })
    .then((payload) => {
      payload.data.forEach((fileObject) => {
        putFileToS3(fileObject)
        .then(() => updateProgress(payload.data.length))
        .catch((error) => callback(error, `Error while uploading ${fileObject.name} file to S3`));
      });
    })
    .catch((error) => {
      callback(error, 'Failed to get files in repository.');
    });
};
