
import * as Nunjucks from 'nunjucks';
import { readdir } from 'node:fs/promises';
import { Response } from '@scloud/lambda-api/dist/types';

let environment: Nunjucks.Environment;

// Adapted from application.ts

const getDirectories = async (source: string): Promise<string[]> => {
  try {
    const directories = await readdir(source, { withFileTypes: true });
    return directories
      .filter((dirent) => {
        return dirent.isDirectory();
      })
      .map((dirent) => {
        return `${source}/${dirent.name}`;
      });
  } catch {
    return [];
  }
};

export async function njkView(template: string, context?: any, statusCode = 200): Promise<Response> {
  if (!environment) {
    const distributionPagesDirectories = await getDirectories('pages');
    environment = Nunjucks.configure(distributionPagesDirectories, { watch: false });
  }
  const njk = Nunjucks.compile(template, environment);
  const body = njk.render(context);
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html',
    },
    body,
  };
}
