
import * as Nunjucks from 'nunjucks';
import { readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

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
    console.log('njkView distributionPagesDirectories', distributionPagesDirectories);
    environment = Nunjucks.configure([
      ...distributionPagesDirectories,
      'views',
      'src/pages',
      'node_modules/govuk-frontend',
      'node_modules/naturescot-frontend',
    ], { watch: false });
  }
  console.log('njkView readFileSync', template);
  // const njk = Nunjucks.compile(template, environment);
  console.log('njkView render context', context);
  const rendered = Nunjucks.render(template, context);
  console.log('njkView rendered', rendered);
  return rendered;
  // return njk.render(context);
}
