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
  gazetteerApiEndpoint: env('PC_LOOKUP_API_URL'),
  feedbackUrl: env('DEER_FEEDBACK_URL'),
  underTest: Boolean(env('UNDER_TEST'),
};

async function errorHandler(request: Request, e: Error): Promise<Response> {
  await slackLog(`${e.stack}`);
  return { statusCode: 500, body: { error: `Internal server error: ${request.path}` } };
}

const sessionHandler: ContextBuilder = async (request: Request) => {
  request.context.sessionGet = <T>(key: string): T => {
    return sessionGet(key, request);
  };
  request.context.sessionSet = <T>(key: string, value: T, response: Response): T => {
    sessionSet(key, value, request, response);
    return value;
  };
  request.context.sessionFlash = <T>(response: Response, type?: string, message?: any, isOverride?: boolean): T[] => {
    return []; // TODO: flash?
  };
};

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const result = await apiHandler(event, context, routes(config), errorHandler, undefined, sessionHandler);
    return result;
  } catch (e) {
    await slackLog(`${(e as Error).stack}`);
    return {
      statusCode: 500,
      body: 'Error',
    };
  }
}

