#!/usr/bin/env bash
# Exercises the AI counsellor, PDF report generation/download, and consent gating.
set -u
BASE="http://localhost:3200"
J=$(mktemp -d)
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then echo "  PASS  $1"; PASS=$((PASS+1)); else echo "  FAIL  $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi; }
has()  { if echo "$2" | grep -q "$3"; then echo "  PASS  $1"; PASS=$((PASS+1)); else echo "  FAIL  $1 (missing '$3')"; FAIL=$((FAIL+1)); fi; }

curl -s -c "$J/s" -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -d '{"email":"student@pathalign.demo","password":"Student@123"}' -o /dev/null
curl -s -c "$J/a" -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -d '{"email":"admin@pathalign.demo","password":"Admin@123"}' -o /dev/null

echo "== AI counsellor (demo provider, real RAG) =="
CONV=$(curl -s -b "$J/s" -X POST "$BASE/api/chat/conversations" -H 'content-type: application/json' -d '{}')
CID=$(echo "$CONV" | sed 's/.*"id":"\([^"]*\)".*/\1/')
check "conversation created" "yes" "$([ -n "$CID" ] && echo yes || echo no)"

REPLY=$(curl -s -b "$J/s" -X POST "$BASE/api/chat/conversations/$CID/messages" \
  -H 'content-type: application/json' \
  -d '{"message":"After an ITI electrician course, what salary can I expect in Pune?"}')
has "reply contains content" "$REPLY" '"reply"'
has "classified as concern"  "$REPLY" '"concern"'
has "sends sources"          "$REPLY" '"sources"'
has "demo mode reported"     "$REPLY" '"mode":"demo"'
has "no LLM fallback needed" "$REPLY" '"usedFallback":false'
echo "  reply: $(echo "$REPLY" | sed 's/.*"reply":"\([^"]*\)".*/\1/' | cut -c1-110)"

# Hindi is exercised in smoke-hindi.mjs, which sends a correctly encoded UTF-8
# body. curl -d in this bash shell mangles Devanagari, which is a shell
# encoding artifact, not an application bug.

echo "== privacy: conversation is NOT exposed without consent =="
CASE_BODY=$(curl -s -b "$J/s" -X POST "$BASE/api/cases" -H 'content-type: application/json' \
  -d '{"subject":"Need help with fees","description":"The recorded fees look higher than we expected and we need advice.","category":"FINANCIAL_LIMITATION","shareConversation":false}')
CASE_ID=$(echo "$CASE_BODY" | sed 's/.*"id":"\([^"]*\)".*/\1/')
DETAIL=$(curl -s -b "$J/a" "$BASE/api/cases/$CASE_ID")
has "case created"            "$DETAIL" '"subject":"Need help with fees"'
has "transcript withheld"     "$DETAIL" '"conversation":null'

echo "== PDF report =="
REPORT=$(curl -s -b "$J/s" -X POST "$BASE/api/reports" -H 'content-type: application/json' \
  -d '{"type":"FAMILY_AGREEMENT","language":"EN"}')
RID=$(echo "$REPORT" | sed 's/.*"id":"\([^"]*\)".*/\1/')
check "report generated" "yes" "$([ -n "$RID" ] && echo yes || echo no)"

curl -s -b "$J/s" "$BASE/api/reports/$RID/pdf" -o "$J/report.pdf" -w '%{http_code}' > "$J/status"
check "pdf returns 200" "200" "$(cat "$J/status")"
check "pdf magic header" "%PDF" "$(head -c 4 "$J/report.pdf")"
SZ=$(wc -c < "$J/report.pdf")
check "pdf is substantial (>20KB)" "yes" "$([ "$SZ" -gt 20000 ] && echo yes || echo no)"
echo "  pdf bytes: $SZ"
if command -v strings >/dev/null 2>&1; then
  TXT=$(strings "$J/report.pdf" | tr -d '\n')
  has "pdf has brand header" "$TXT" 'PATHALIGN'
  has "pdf has footer"       "$TXT" 'Page 1 of'
fi

# A non-existent report is 404 before any ownership check; ownership is
# covered by smoke.sh's per-role API matrix and the getReportPayload guard.
check "unknown report pdf is 404" 404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$J/a" "$BASE/api/reports/does-not-exist/pdf")"
check "anonymous pdf is blocked" 401 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/reports/$RID/pdf")"

echo
echo "PASS=$PASS FAIL=$FAIL"
rm -rf "$J"
[ "$FAIL" -eq 0 ]
