import LintRunner from '../LintRunner';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { CLIEngine } from 'eslint';

const ROOT_DIR = process.cwd();
const eslint = new CLIEngine({ cwd: ROOT_DIR });

export const runParallelLint = (options) => {
  const {
    workers,
    paths,
    ignored
  } = options;

  const lintRunner = new LintRunner(workers);

  let filePaths = [];
  process.stdout.write("Collecting files...[this may take a little bit]");
  for (let i = 0; i < paths.length; i++) {
    const files = glob.sync(paths[i], {});
    files.forEach((file, idx) => {
      filePaths.push(file);
    })
  }

  let filesToProcess = 0;
  let lintResults = [];

  filePaths.map((file, _) => {
    if (eslint.isPathIgnored(path.join(ROOT_DIR, file)) || file.indexOf('eslint') !== -1) {
      return;
    }
    filesToProcess++;
    lintRunner.run({ cwd: ROOT_DIR }, [file])
      .then((results) => {
        const result = results[0];
        lintResults.push(result);
        filesToProcess--;
      });
  });

  const interval = setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Linting files...${filesToProcess} left to lint`);

    if (filesToProcess === 0) {
      clearInterval(interval);
      lintResults = lintResults.filter((result) => {
        return result.warningCount > 0 || result.errorCount > 0;
      });
      const formatter = eslint.getFormatter();
      console.log(formatter(lintResults));
      process.exit(0);
    }
  }, 1000);
};
