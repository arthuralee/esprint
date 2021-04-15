import glob from 'glob';
import path from 'path';
import { CLIEngine } from 'eslint';
import LintRunner from '../LintRunner';

export const check = (options) => {
  const {
    workers,
    paths,
    formatter,
    ignored,
    rcPath,
    maxWarnings,
    quiet,
    fix
  } = options;

  const lintRunner = new LintRunner(workers, !!quiet, fix);
  const rcDir = path.dirname(rcPath);
  const eslint = new CLIEngine({ cwd: rcDir });

  const filePaths = (paths.map(globPath => glob.sync(globPath, { cwd: rcDir, absolute: true, ignore: ignored })) || []).flat();
  // filter out the files that we tell eslint to ignore
  const nonIgnoredFilePaths = filePaths.filter((filePath) => {
    return !eslint.isPathIgnored(filePath);
  });

  lintRunner.run(nonIgnoredFilePaths)
    .then((results) => {
      const records = results.records.filter((record) => {
        return record.warningCount > 0 || record.errorCount > 0;
      });

      const lintFormatter = eslint.getFormatter(formatter);
      console.log(lintFormatter(records));
      process.exit(results && (results.errorCount > 0 ? 1 : 0
        || results.warningCount > maxWarnings ? 1 : 0));
    });
};
