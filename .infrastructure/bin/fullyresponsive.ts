#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import FullyresponsiveStack from '../lib/fullyresponsive-stack';

const app = new cdk.App();
const stack = new FullyresponsiveStack(app, 'Fullyresponsive', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  description: 'Fully Responsive: this version of the app runs on Lambda. It\'s always available but only uses compute and storage capacity on-demand when requests come in',

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
Tags.of(stack).add('stack', stack.stackName);
