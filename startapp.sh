#!/usr/bin/env sh
BIN_DIR="./node_modules/.bin"
[ "${DEBUG}" = "no" ] && export NODE_ENV="production"
export PATH="${BIN_DIR}:$PATH"
hash yarn >/dev/null 2>&1 || npm i yarn
yarn
wait-port "${DB_HOST:-db}":3306
wait-port "${REDIS_HOST:-redis}":6379
ENTRYPOINT="main.js"
if [ "${SESSION_SECRET:-not-set}" = "not-set" ]; then
  echo "WARNING: SESSION SECRET IS NOT SECURE"
  echo "WARNING: SESSION SECRET IS NOT SECURE"
  echo "WARNING: SESSION SECRET IS NOT SECURE"
fi
if [ "${AUTO_RELOAD}" = "yes" ]; then
  nodemon -L --delay 1 -e js,json,ejs,md $ENTRYPOINT
else
  node $ENTRYPOINT
fi
