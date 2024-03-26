#!/usr/bin/env node

import cli from '../lib/cli.js';

// Default to help text when they aren't running any commands.
cli().parse( ! process.argv.length ? [ '--help' ] : process.argv );
