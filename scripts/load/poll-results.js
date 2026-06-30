// k6 read-path load test: simulates many viewers polling results at once.
//
// Models the polling load that scales with the number of open results/monitor
// pages (every 30s each), which is independent of vote volume. Use it to prove
// the single-flight micro-cache holds up: a burst of concurrent pollers should
// collapse to ~one vote scan per cache window instead of starving the DB pool.
//
// By default it hits the PUBLIC endpoint. The public path is embargoed (cheap)
// while an election is OPEN; to exercise the expensive cached tally either run
// against a CLOSED election, or set ADMIN=1 and provide ADMIN_COOKIE with a
// valid admin session (see scripts/load/README.md).
//
// Prereqs:
//   1. npm run seed:load            (writes .data/voters.json with electionId)
//   2. npm run build && npm start   (or the dev server)
//   3. k6 run scripts/load/poll-results.js
//
// Tunables (env): BASE_URL, VUS (default 200), DURATION (default 1m),
//                 ADMIN ("1" to add ?admin=1), ADMIN_COOKIE (session cookie header).
import http from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const ADMIN = __ENV.ADMIN === "1";

const data = new SharedArray("load-data", () => [
  JSON.parse(open("./.data/voters.json")),
]);
const ELECTION_ID = data[0].electionId;

export const options = {
  scenarios: {
    poll: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 200),
      duration: __ENV.DURATION || "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const url = `${BASE_URL}/api/results/${ELECTION_ID}${ADMIN ? "?admin=1" : ""}`;
  const params = { headers: {} };
  if (ADMIN && __ENV.ADMIN_COOKIE) {
    params.headers.Cookie = __ENV.ADMIN_COOKIE;
  }

  const res = http.get(url, params);
  check(res, {
    "status 200": (r) => r.status === 200,
    "has payload": (r) => {
      try {
        return typeof r.json("electionId") === "string";
      } catch {
        return false;
      }
    },
  });
}
