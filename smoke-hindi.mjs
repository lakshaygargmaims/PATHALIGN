// Verifies Hindi classification through the real HTTP path with a correctly
// encoded UTF-8 body (avoids shell/curl encoding ambiguity).
const BASE = 'http://localhost:3200';

const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'student@pathalign.demo', password: 'Student@123' }),
});
const cookie = login.headers.get('set-cookie')?.split(';')[0];
if (!cookie) { console.error('login failed', login.status); process.exit(1); }

const conv = await (
  await fetch(`${BASE}/api/chat/conversations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: '{}',
  })
).json();
const cid = conv.data.conversation.id ?? conv.data.id;

const cases = [
  ['मुझे नौकरी की सुरक्षा की चिंता है, क्या यह सुरक्षित है?', 'HI', 'JOB_SECURITY'],
  ['इस ट्रेड की तनख्वाह बहुत कम है', 'HI', 'LOW_SALARY'],
  ['The salary is too low and there is no job guarantee', 'EN', 'LOW_SALARY'],
];

let pass = 0;
let fail = 0;
for (const [message, wantLang, wantConcern] of cases) {
  const res = await (
    await fetch(`${BASE}/api/chat/conversations/${cid}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8', cookie },
      body: JSON.stringify({ message }),
    })
  ).json();
  const a = res.data.analysis;
  const ok = a.language === wantLang && a.concern === wantConcern;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  "${message.slice(0, 42)}…" → lang=${a.language} concern=${a.concern} (want ${wantLang}/${wantConcern})`,
  );
  ok ? pass++ : fail++;
}
console.log(`\nPASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
