### github-to-s3-lambda-deployer
Simple solution for deploying your static pages to S3 with every commit to master.

##### Setup
1. Login to your AWS Account
2. Go to Mobile Services -> SNS -> Topics and "Create new topic", name it something like 'github-deploy'
3. Copy ARN
4. Go to your projects page on GitHub, go to Settings -> Webhooks -> Add Service SNS and fill all the necessary information
5. Clone this project and run `npm install`, then `npm run setup`.
6. Open `.env` file and fill necessary information, paste ANR and AWS secrets here, `AWS_CONFIRMATION_SNS_TOPIC_ANR` is optional
7. Dry run it with `npm run dry-run`
8. If everything's k, run `npm run deploy`
9. In AWS Lambda panel, go to your function -> Event Sources and click "Add event source" to link your
