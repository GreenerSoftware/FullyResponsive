
import * as Nunjucks from 'nunjucks';
import { readdir } from 'node:fs/promises';

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

export async function njkView(template: string, context?: any): Promise<string> {
  if (!environment) {
    const distributionPagesDirectories = await getDirectories('pages');
    environment = Nunjucks.configure([
      ...distributionPagesDirectories,
      'pages',
      'views',
      'node_modules/govuk-frontend',
      'node_modules/naturescot-frontend',
    ], { watch: false });
  }
  const name = `${template}.njk`;
  // const njk = Nunjucks.compile(template, environment);
  const rendered = Nunjucks.render(name, context);
  return rendered;
  // return njk.render(context);
}
