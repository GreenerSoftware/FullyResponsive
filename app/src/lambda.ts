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
  pathPrefix: '/haggis-return',
  // axios,
  apiEndpoint: env('HAGGIS_API_URL'),
  hostPrefix: env('HAGGIS_HOST_PREFIX'),
  sessionSecret: env('HAGGIS_SESSION_SECRET'),
  gazetteerApiEndpoint: env('PC_LOOKUP_API_URL', 'http://mock-gazetteer-api/endpoint'),
  feedbackUrl: env('HAGGIS_FEEDBACK_URL', 'https://www.google.com'),
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
    const rs = routes(config);
    const result = await apiHandler(event, context, rs, errorHandler, undefined, sessionHandler);

    if (typeof result.body === 'string') {
      // Remove the svg logo in the header
      const content = result.body;
      const logoStart = content.indexOf('<svg xmlns="http://www.w3.org/2000/svg"');
      const logoEnd = content.indexOf('</svg>') + 6;
      const toReplace = content.substring(logoStart, logoEnd);
      result.body = content.replace(toReplace, ''); // Placeholder for the logo - nothing for now

      // Update the copyright text and link under the logo in the footer
      result.body = result.body.replace('NatureScot', 'GreenerSoftware');
      result.body = result.body.replace('www.nature.scot', 'greenersoftware.net');
    }

    return result;
  } catch (e) {
    await slackLog(`${(e as Error).stack}`);
    return {
      statusCode: 500,
      body: 'Error',
    };
  }
}

