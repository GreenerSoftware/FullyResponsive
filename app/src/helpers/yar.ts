import { Request, Response } from "@scloud/lambda-api/dist/types";

export function sessionGet(key: string, request: Request) {
  const data = request.cookies.yar || '{}';
  const session = JSON.parse(data);
  return session[key];
}

export function sessionPut(key: string, value: any, request: Request, response: Response) {
  let data = request.cookies.yar || '{}';
  const session = JSON.parse(data);
  session[key] = value;
  data = JSON.stringify(session);
  response.cookies = response.cookies || {};
  response.cookies.yar = data;
}