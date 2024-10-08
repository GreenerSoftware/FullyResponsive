import { Request, Response } from "@scloud/lambda-api/dist/types";

function getSession(request: Request): Record<string, unknown> {
  if (request.context.session) return request.context.session;

  let data = request.cookies.session || '{}';
  const session = JSON.parse(data);
  request.context.session = session;
  return session;
}

function setSession(session: Record<string, any>, request: Request, response: Response) {
  request.context.session = session;

  const data = JSON.stringify(session);
  response.cookies = response.cookies || {};
  response.cookies.session = data;
}

export function unFlash(request: Request) {
  const session = getSession(request);
  session['_flash'] = {};
  // Can't currently do this from the lambda-api handler because there's no Response object available.
  // setSession(session, request, response);
}

export async function sessionGet<T>(key: string, request: Request): Promise<T> {
  const session = getSession(request);
  return session[key] as T;
}

export async function sessionSet(key: string, value: any, request: Request, response: Response) {
  const session = getSession(request);
  session[key] = value;
  setSession(session, request, response);
}

// export async function sessionFlash<T>(request: Request, response: Response, type?: string, message?: any, isOverride?: boolean): Promise<T[]> {
//   const session = getSession(request);
//   session['_flash'] = session['_flash'] || {} as Record<string, unknown>;
//   if (message) (session['_flash'] as Record<string, unknown>)[type || 'default'] = message;
//   setSession(session, request, response);

//   return (session['_flash'] as Record<string, unknown>)[type || 'default'] as T[];
// }


// (async () => {
//   const request: Request = {
//     context: {},
//     method: 'GET',
//     path: '/path',
//     pathParameters: {},
//     query: {},
//     headers: {},
//     cookies: {},
//     body: 'body',
//   };
//   const response: Response = {
//     cookies: {},
//     statusCode: 200,
//     headers: {},
//   };
//   await sessionSet('key', 'value', request, response);
//   await sessionFlash(request, response, 'type', 'message');
//   console.log(JSON.stringify(response));
// })();