
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  BuildsBucket, QueueFunction, WebApp, githubActions,
} from '@scloud/cdk-patterns';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
// import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

// Credentials
// PERSONAL_ACCESS_TOKEN - create a Github personal access token (classic) with 'repo' scope and set this in .infrastructure/secrets/github.sh using export PERSONAL_ACCESS_TOKEN=ghp_...
// AWS_PROFILE           - if you've set up a profile to access this account, set this in .infrastructure/secrets/aws.sh using export AWS_PROFILE=...

// Route 53
const DOMAIN_NAME = 'fullyresponsive.greenersoftware.net';
const ZONE_ID = 'Z06584811PPY6JR34ZMMO';

// Github - set in secrets/github.sh
// const OWNER = 'GreenerSoftware';
// const REPO = 'fullyresponsive';

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`No environment variable value for ${key}`);
  return value;
}

export default class FullyresponsiveStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // This only needs to be created once per account. If you already have one, you can delete this.
    githubActions(this).ghaOidcProvider();

    // A bucket to hold zip files for Lambda functions
    // This is useful because updating a Lambda function in the infrastructure might set the Lambda code to a default placeholder.
    // Having a bucket to store the code in means we can update the Lambda function to use the code, either here in the infrastructure build, or from the Github Actions build.
    const builds = new BuildsBucket(this);

    // You'll need a zone to create DNS records in. This will need to be referenced by a real domain name so that SSL certificate creation can be authorised.
    // NB the DOMAIN_NAME environment variable is defined in .infrastructure/secrets/domain.sh
    const zone = this.zone(DOMAIN_NAME, ZONE_ID);

    // Slack
    const slackQueue = this.slack(builds);

    // DynamoDB table for submissions
    const submissions = new Table(this, 'submissions', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the frontend and API using Cloudfront
    // The following calls will create variables in Github Actions that can be used to deploy the frontend and API:
    // * API_LAMBDA - the name of the Lambda function to update when deploying the API
    // * CLOUDFRONT_BUCKET - for uploading the frontend
    // * CLOUDFRONT_DISTRIBUTIONID - for invalidating the Cloudfront cache
    const webApp = WebApp.node(this, 'app', zone, DOMAIN_NAME, false, false, {
      environment: {
        HAGGIS_API_URL: `https://${DOMAIN_NAME}/haggis-api/v1`,
        HAGGIS_HOST_PREFIX: `https://${DOMAIN_NAME}`,
        HAGGIS_SESSION_SECRET: 'CA<tk~7Y1IxMhITD?5QQ`DacPQM!t6w%', // NB not particularly secret so just for proof of concept. In reality would use an AWS secret. Geberated using https://www.lastpass.com/features/password-generator
        // gazetteerApiEndpoint: process.env.PC_LOOKUP_API_URL ?? '',
        // feedbackUrl: process.env.HAGGIS_FEEDBACK_URL ?? 'https://www.google.com',
        // underTest: Boolean(process.env.UNDER_TEST),
        SUBMISSIONS_TABLE: submissions.tableName,
        SLACK_QUEUE_URL: slackQueue.queueUrl,
      },
      functionProps: {
        memorySize: 3008,
        //code: Code.fromBucket(builds, 'app.zip'), // This can be uncommented once you've run a build of the app code
      },
      handler: 'lambda.handler',
    });
    submissions.grantReadWriteData(webApp.lambda);
    slackQueue.grantSendMessages(webApp.lambda);

    // Set up OIDC access from Github Actions - this enables builds to deploy updates to the infrastructure
    githubActions(this).ghaOidcRole({ owner: env('OWNER'), repo: env('REPO') });
  }

  /**
   * NB: creating a hosted zone is not free. You will be charged $0.50 per month for each hosted zone.
   * @param zoneName The name of the hosted zone - this is assumed to be the same as the domain name and will be used by other constructs (e.g. for SSL certificates),
   * @param zoneId Optional. The ID of an existing hosted zone. If you already have a hosted zone, you can pass the zoneId to this function to get a reference to it, rather than creating a new one.
   */
  zone(zoneName: string, zoneId?: string): IHostedZone {
    if (zoneId) {
      return HostedZone.fromHostedZoneAttributes(this, 'zone', {
        hostedZoneId: zoneId,
        zoneName,
      });
    }

    // Fall back to creating a new HostedZone - costs $0.50 per month
    return new HostedZone(this, 'zone', {
      zoneName,
    });
  }

  /**
   * Component to send Slack messages for general logging.
   */
  slack(builds: Bucket): Queue {
    const { queue } = QueueFunction.node(this, 'slack', {
      environment: {
        SLACK_WEBHOOK: process.env.SLACK_WEBHOOK || '',
      },
      functionProps: {
        // code: Code.fromBucket(builds, 'slack.zip'),
      },
    });
    return queue;
  }
}
