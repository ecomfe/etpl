#! /bin/sh

TOOL_DIR=$(dirname "$0")
PROJ_DIR="${TOOL_DIR}/.."

cd "${PROJ_DIR}"
rm -rf dist
mkdir dist
cp src/main.js dist/main.source.js
cp src/tpl.js dist/tpl.source.js
uglifyjs dist/main.source.js -mco dist/main.js
uglifyjs dist/tpl.source.js -mco dist/tpl.js
