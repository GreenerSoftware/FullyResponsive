// https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { apiHandler } from '@scloud/lambda-api';
import { ContextBuilder, Request, Response } from '@scloud/lambda-api/dist/types';
import routes from './routes';
import { slackLog } from './helpers/slack';
import { sessionGet, sessionSet } from 'helpers/yar';
import { ApplicationConfig } from 'application-config';
import { env } from 'helpers/util';

const config: ApplicationConfig = {
  pathPrefix: '/deer-return',
  // axios,
  apiEndpoint: env('DEER_API_URL'),
  hostPrefix: env('DEER_HOST_PREFIX'),
  sessionSecret: env('DEER_SESSION_SECRET'),
  gazetteerApiEndpoint: env('PC_LOOKUP_API_URL', 'http://mock-gazetteer-api/endpoint'),
  feedbackUrl: env('DEER_FEEDBACK_URL', 'https://www.google.com'),
  underTest: Boolean(env('UNDER_TEST', 'false')),
};

async function errorHandler(request: Request, e: Error): Promise<Response> {
  await slackLog(`${e.stack}`);
  return { statusCode: 500, body: { error: `Internal server error: ${request.path}` } };
}

const sessionHandler: ContextBuilder = async (request: Request) => {
  // unFlash(request);
  request.context.sessionGet = <T>(key: string): Promise<T> => {
    return sessionGet(key, request);
  };
  request.context.sessionSet = <T>(key: string, value: T, response: Response) => {
    sessionSet(key, value, request, response);
  };
  // request.context.sessionFlash = <T>(response: Response, type?: string, message?: any, isOverride?: boolean): Promise<T[]> => {
  //   return sessionFlash(request, response, type, message, isOverride);
  // };
};

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    // Show output in the Lambda logs for visibility (because only David has Slack integration) and debugging
    console.log(event.httpMethod, event.path);
    if (event.httpMethod === 'POST' && event.body) {
      console.log('body:', event.body);
    }
    await slackLog(' > request', event.httpMethod, event.path, event.headers['cookie'] || event.headers['Cookie']);
    const rs = routes(config);
    const result = await apiHandler(event, context, rs, errorHandler, undefined, sessionHandler);
    if ((result.headers || {})['cookie']) {
      await slackLog('*** replacing header cookie');
      (result.headers || {})['cookie'] = `${(result.headers || {})['cookie']}`.replace('SameSite=Strict', 'SameSite=None');
    }
    if ((result.headers || {})['Cookie']) {
      await slackLog('*** replacing header Cookie');
      (result.headers || {})['Cookie'] = `${(result.headers || {})['Cookie']}`.replace('SameSite=Strict', 'SameSite=None');
    }
    if ((result.multiValueHeaders || {})['cookie']) {
      await slackLog('*** replacing multi header cookie');
      (result.multiValueHeaders || {})['cookie'].map((cookie: string | number | boolean) => `${cookie}`.replace('SameSite=Strict', 'SameSite=None'));
    }
    if ((result.multiValueHeaders || {})['Cookie']) {
      await slackLog('*** replacing multi header Cookie:', JSON.stringify((result.multiValueHeaders || {})['Cookie']));
      (result.multiValueHeaders || {})['Cookie'].map((cookie: string | number | boolean) => `${cookie}`.replace('SameSite=Strict', 'SameSite=None'));
    }
    await slackLog(' < response', event.httpMethod, event.path, `${(result.headers || {})['cookie'] || (result.headers || {})['Cookie'] || (result.multiValueHeaders || {})['cookie'] || (result.multiValueHeaders || {})['Cookie']}`);
    return result;
  } catch (e) {
    await slackLog(`${(e as Error).stack}`);
    return {
      statusCode: 500,
      body: 'Error',
    };
  }
}

