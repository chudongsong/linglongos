#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:7001"
COOKIE="/tmp/api-cookie-e2e-run.txt"
USER="tester_$(date +%s)"
PASS="pass12345"

echo "Health:"
curl -sS "$BASE/health"; echo

echo "Register: $USER"
curl -sS -c "$COOKIE" -H "Content-Type: application/json" \
  --data-binary "{\"username\":\"$USER\",\"password\":\"$PASS\"}" \
  "$BASE/api/v1/auth/register"; echo

echo "Bind TOTP:"
curl -sS -b "$COOKIE" "$BASE/api/v1/auth/google-auth-bind" -o /tmp/bind.json
SECRET=$(node -e 'const fs=require("fs"); const p="/tmp/bind.json"; const j=JSON.parse(fs.readFileSync(p,"utf8")); console.log(j.data.secret)')
export SECRET
echo "Secret: $SECRET"

echo "Verify TOTP:"
TOKEN=$(node -e 'const m=require(require.resolve("otplib", { paths: ["/Users/bt.cn/linglongos/apps/api"] })); const { authenticator } = m; console.log(authenticator.generate(process.env.SECRET))')
curl -sS -b "$COOKIE" -c "$COOKIE" -H "Content-Type: application/json" --data-binary "{\"token\":\"$TOKEN\"}" "$BASE/api/v1/auth/google-auth-verify"; echo

echo "System Info:"
curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/api/v1/system/info"; echo

echo "Bind Panel Key:"
curl -sS -b "$COOKIE" -c "$COOKIE" -H "Content-Type: application/json" \
  --data-binary '{"type":"bt","url":"http://httpbin.org","key":"12345678901234567890123456789012"}' \
  "$BASE/api/v1/proxy/bind-panel-key"; echo

echo "Proxy GET:"
curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/api/v1/proxy/request?url=/anything&panelType=bt&method=GET" | head -c 600; echo

echo "Done."