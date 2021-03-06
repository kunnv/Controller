#!/usr/bin/env node

/*
 *  *******************************************************************************
 *  * Copyright (c) 2018 Edgeworx, Inc.
 *  *
 *  * This program and the accompanying materials are made available under the
 *  * terms of the Eclipse Public License v. 2.0 which is available at
 *  * http://www.eclipse.org/legal/epl-2.0
 *  *
 *  * SPDX-License-Identifier: EPL-2.0
 *  *******************************************************************************
 *
 */

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

const daemonize = require('daemonize2');
const db = require('./sequelize/models');
const Cli = require('./cli');
const logger = require('./logger');

function main() {
  const daemon = daemonize.setup({
    main: 'server.js',
    name: 'iofog-controller',
    pidfile: 'iofog-controller.pid',
    silent: true,
  });

  const cli = new Cli();

  daemon
    .on('starting', () => {
      logger.silly('Starting iofog-controller...')
    })
    .on('stopping', () => {
      logger.silly('Stopping iofog-controller...')
    })
    .on('stopped', (pid) => {
      logger.silly('iofog-controller stopped.')
    })
    .on('running', (pid) => {
      logger.silly('iofog-controller already running. PID: ' + pid)
    })
    .on('notrunning', () => {
      logger.silly('iofog-controller is not running')
    })
    .on('error', (err) => {
      logger.silly('iofog-controller failed to start:  ' + err.message)
    });

  cli.run(daemon)
}

db.sequelize
  .sync()
  .then(db.migrate)
  .then(db.seed)
  .then(main)
  .catch((err) => {
    logger.silly('Unable to initialize the database.', err)
    process.exit(1)
  });