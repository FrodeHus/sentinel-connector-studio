#!/bin/sh
set -e

# Generate a runtime config script from environment variables.
# This allows operators to set App Insights and other config at container
# startup without needing to rebuild the image.
#
# The file is written to /tmp (a writable tmpfs) and served by nginx at
# /env-config.js.  The SPA reads window.__APP_CONFIG__ as a fallback when
# the build-time VITE_* variable was not baked into the bundle.

# Escape backslashes and double-quotes so the value is safe inside a JS string.
conn=$(printf '%s' "${APPINSIGHTS_CONNECTION_STRING:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')

printf 'window.__APP_CONFIG__ = {\n  "appInsightsConnectionString": "%s"\n};\n' "$conn" \
  > /tmp/env-config.js

exec "$@"
