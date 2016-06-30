'use strict';
const http = require('axios');
const AWS = require('aws-sdk');

const path = 'static/';
const bucketName = process.env.BUCKET_NAME;
const storageClass = 'STANDARD'; // STANDARD | REDUCED_REDUNDANCY | STANDARD_IA

const confirmationTopicArn = process.env.AWS_CONFIRMATION_SNS_TOPIC_ANR;
const mailMessage = `Deploy to ${bucketName}/${path} succeeded!`;
const mailSubject = 'Deploy succeeded';

const sns = new AWS.SNS();
const s3 = new AWS.S3({
  params: {
    Bucket: bucketName
  }
});

const computeContentType = (filename) => {
  const parts = filename.split('.');
  switch (filename.split('.')[parts.length-1]) {
    case 'png':
      return "image/png";
    case 'html':
      return "text/html";
    case 'js':
      return "application/javascript";
    case 'css':
      return "text/css";
  }
};

const confirmUpload = (callback) => {
  sns.publish({
    Message: mailMessage,
    Subject: mailSubject,
    TopicArn: confirmationTopicArn,
    MessageAttributes: {
      someKey: {
        DataType: 'String',
        StringValue: 'Test'
      }
    }
  }, (err, data) => {
    if (err) callback(err, 'Failed to send confirmation');
    else callback(null, 'Done!');
  });
};

const putFileToS3 = (fileObject) => new Promise((resolve, reject) => {
  http.get(fileObject.download_url)
  .then((payload) => {
    s3.putObject({
      Bucket: bucketName,
      ACL: 'public-read',
      ContentType: computeContentType(fileObject.name),
      Key: fileObject.name,
      Body: payload.data,
      StorageClass: storageClass
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
        if (confirmationTopicArn) confirmUpload(callback);
        else callback(null, 'Done!');
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
