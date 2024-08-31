
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
    console.log('njkView distributionPagesDirectories', distributionPagesDirectories);
    environment = Nunjucks.configure([
      ...distributionPagesDirectories,
      'pages',
      'views',
      'node_modules/govuk-frontend',
      'node_modules/naturescot-frontend',
    ], { watch: false });
  }
  const name = `${template}.njk`;
  console.log('njkView readFileSync', name);
  // const njk = Nunjucks.compile(template, environment);
  console.log('njkView render context', context);
  const rendered = Nunjucks.render(name, context);
  console.log('njkView rendered', rendered);
  return rendered;
  // return njk.render(context);
}
