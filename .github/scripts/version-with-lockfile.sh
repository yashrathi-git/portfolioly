#!/bin/bash
set -e

# Run changesets version
yarn changeset version

# Update lockfile
yarn install --mode update-lockfile
