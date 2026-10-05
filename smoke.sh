#!/usr/bin/env bash
# End-to-end smoke test against a running dev server on :3200.
# Verifies auth, RBAC boundaries, and that each role's dashboards render.
set -u
BASE="http://localhost:3200"
PASS=0; FAIL=0
J=$(mktemp -d)

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; PASS=$((PASS+1));
  else echo "  FAIL  $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}

login() { # email password cookiejar
  curl -s -c "$J/$3" -X POST "$BASE/api/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" -o /dev/null -w '%{http_code}'
}

code() { curl -s -b "$J/$1" -o /dev/null -w '%{http_code}' "$BASE$2"; }

echo "== anonymous =="
check "health is public"            200 "$(code anon /api/health)"
check "careers list is public"      200 "$(code anon /api/public/careers)"
check "admin API is blocked"        401 "$(code anon /api/admin/stats)"
check "counsellor API is blocked"   401 "$(code anon /api/counsellor)"
check "cases API is blocked"        401 "$(code anon /api/cases)"

echo "== student =="
S=$(login student@pathalign.demo 'Student@123' student)
check "login"                       200 "$S"
check "me"                          200 "$(code student /api/auth/me)"
check "own assessment"              200 "$(code student /api/assessments)"
check "own cases"                   200 "$(code student /api/cases)"
check "admin stats blocked"         403 "$(code student /api/admin/stats)"
check "counsellor API blocked"      403 "$(code student /api/counsellor)"
check "admin users blocked"         403 "$(code student /api/admin/users)"
check "student dashboard page"      200 "$(code student /student)"
check "student assessment page"     200 "$(code student /student/assessment)"
check "student reports page"        200 "$(code student /student/reports)"
check "student cases page"          200 "$(code student /student/cases)"
check "student profile page"        200 "$(code student /student/profile)"
check "student myths page"          200 "$(code student /student/myths)"
check "student twin page"           200 "$(code student /student/twin)"
check "student plan page"           200 "$(code student /student/plan)"

echo "== parent =="
P=$(login parent@pathalign.demo 'Parent@123' parent)
check "login"                       200 "$P"
check "own cases"                   200 "$(code parent /api/cases)"
check "admin stats blocked"         403 "$(code parent /api/admin/stats)"
check "counsellor API blocked"      403 "$(code parent /api/counsellor)"
check "parent dashboard page"       200 "$(code parent /parent)"
check "parent reports page"         200 "$(code parent /parent/reports)"
check "parent cases page"           200 "$(code parent /parent/cases)"
check "parent profile page"         200 "$(code parent /parent/profile)"
check "parent myths page"           200 "$(code parent /parent/myths)"

echo "== counsellor =="
C=$(login counsellor@pathalign.demo 'Counsel@123' counsellor)
check "login"                       200 "$C"
check "workspace overview"          200 "$(code counsellor /api/counsellor)"
check "assigned cases"              200 "$(code counsellor '/api/cases?mine=1')"
check "appointments"                200 "$(code counsellor /api/appointments)"
check "sessions view"               200 "$(code counsellor '/api/counsellor?view=sessions')"
check "admin stats blocked"         403 "$(code counsellor /api/admin/stats)"
check "admin export blocked"        403 "$(code counsellor '/api/admin/export?type=overview')"
check "counsellor dashboard page"   200 "$(code counsellor /counsellor)"
check "counsellor cases page"       200 "$(code counsellor /counsellor/cases)"
check "counsellor queue page"       200 "$(code counsellor /counsellor/queue)"
check "counsellor sessions page"    200 "$(code counsellor /counsellor/sessions)"
check "counsellor appts page"       200 "$(code counsellor /counsellor/appointments)"
check "counsellor history page"     200 "$(code counsellor /counsellor/history)"
check "counsellor profile page"     200 "$(code counsellor /counsellor/profile)"

echo "== admin =="
A=$(login admin@pathalign.demo 'Admin@123' admin)
check "login"                       200 "$A"
check "stats"                       200 "$(code admin /api/admin/stats)"
check "users"                       200 "$(code admin /api/admin/users)"
check "trades"                      200 "$(code admin /api/admin/trades)"
check "providers"                   200 "$(code admin /api/admin/providers)"
check "imports"                     200 "$(code admin /api/admin/imports)"
check "counsellors"                 200 "$(code admin /api/admin/counsellors)"
check "settings"                    200 "$(code admin /api/admin/settings)"
check "all cases visible"           200 "$(code admin /api/cases)"
check "export overview"             200 "$(code admin '/api/admin/export?type=overview')"
check "import template"             200 "$(code admin '/api/admin/imports?view=template&recordType=TRADE')"
check "admin dashboard page"        200 "$(code admin /admin)"
check "admin analytics page"        200 "$(code admin /admin/analytics)"
check "admin users page"            200 "$(code admin /admin/users)"
check "admin careers page"          200 "$(code admin /admin/careers)"
check "admin providers page"        200 "$(code admin /admin/providers)"
check "admin data page"             200 "$(code admin /admin/data)"
check "admin counsellors page"      200 "$(code admin /admin/counsellors)"
check "admin reports page"          200 "$(code admin /admin/reports)"
check "admin settings page"         200 "$(code admin /admin/settings)"

echo
echo "security headers:"
curl -s -I "$BASE/" | grep -iE 'strict-transport|x-frame|x-content-type|content-security|referrer-policy|permissions-policy' | sed 's/^/  /'

echo
echo "PASS=$PASS FAIL=$FAIL"
rm -rf "$J"
[ "$FAIL" -eq 0 ]
