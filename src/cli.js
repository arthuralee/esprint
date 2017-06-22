#!/usr/bin/env node

import yargs from 'yargs';
import fs from 'fs';
import os from 'os';
import { stop, check, connect } from './commands/';
import { fork } from 'child_process';
import { findFile } from './util';
import { clearLine } from './cliUtils';
import { CLIEngine } from 'eslint';

const NUM_CPUS = os.cpus().length;

const DEFAULT_PORT_NUMBER = 5004;
const DEFAULT_NUM_WORKERS = 4;

const getEsprintOptions = (argv) => {
  const options = {
    workers: NUM_CPUS,
    port: DEFAULT_PORT_NUMBER,
  };

  const filePath = findFile('.esprintrc');

  if (!filePath) {
    console.error('Unable to find `.esprintrc` file. Exiting...');
    process.exit(1);
  } else {
    // read config file
    const rc = JSON.parse(fs.readFileSync(filePath));

    // validate config file
    if (rc.workers && rc.workers > NUM_CPUS) {
      console.warn(`Number of CPUs specified (${rc.workers}) exceeded system max (${NUM_CPUS}). Using ${NUM_CPUS}`);
      rc.workers = NUM_CPUS;
    }


    Object.assign(options, rc);
    Object.assign(options, {rcPath: filePath});

    // CLI overrides
    if (argv.workers) {
      options.workers = argv.workers;
    }

    return options;
  }
}

const options = getEsprintOptions();
const eslint = new CLIEngine({cwd: options.rcPath});

const usage = `Spins up a server on a specified port to run eslint in parallel.
  Usage: esprint [args]`;

const argv = yargs
  .usage(usage)
  .command('stop', 'Stops the background server', () => {}, () => {
    stop();
  })
  .command('check', 'Runs eslint in parallel with no background server', () => {}, () => {
    check(options, eslint);
  })
  .command(['*', 'start'], 'Starts up a background server which listens for file changes.', () => {}, (argv) => {
    if (!options.port) {
      process.exit(1);
    } else {
      connect(options, eslint);
    }
  })
  .help().argv;
