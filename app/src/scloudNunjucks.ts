
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
    environment = Nunjucks.configure(distributionPagesDirectories, { watch: false });
  }
  const njk = Nunjucks.compile(template, environment);
  return njk.render(context);
}
