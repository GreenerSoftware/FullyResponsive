import { Request, Response } from "@scloud/lambda-api/dist/types";

function getSession(request: Request): Record<string, any> {
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

export function sessionGet(key: string, request: Request) {
  const session = getSession(request);
  return session[key];
}

export function sessionSet(key: string, value: any, request: Request, response: Response) {
  const session = getSession(request);
  session[key] = value;
  setSession(session, request, response);
}

export function sessionFlash(request: Request, response: Response, type?: string, message?: any, isOverride?: boolean) {
  const session = getSession(request);
  session['_flash'] = session['_flash'] || {};
  if (message) session['_flash'][type || 'default'] = message;
  setSession(session, request, response);

  return session['_flash'][type || 'default'];
}