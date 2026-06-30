// k6 write-path load test: simulates an election-day voting spike.
//
// Each iteration casts one ballot for a distinct seeded voter via the guarded
// test endpoint (the SAME castVerifiedBallot transaction the real UI uses), so
// you get a realistic write-path benchmark without scripting the Next
// server-action protocol.
//
// Prereqs:
//   1. npm run seed:load                       (writes .data/voters.json)
//   2. ENABLE_TEST_ENDPOINTS=1 npm run build && ENABLE_TEST_ENDPOINTS=1 npm start
//      (or dev server with ENABLE_TEST_ENDPOINTS=1)
//   3. k6 run scripts/load/cast-ballots.js
//
// Tunables (env):
//   BASE_URL  (default http://localhost:3000)
//   VUS       concurrent virtual voters (default 50)
//
// Each voter is used once: total iterations == number of seeded voters, so
// re-seed before each run for a clean write benchmark.
import http from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";
import exec from "k6/execution";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

const data = new SharedArray("load-data", () =>
  // Single JSON object; wrap in an array element for SharedArray.
  [JSON.parse(open("./.data/voters.json"))],
);
const DATA = data[0];

export const options = {
  scenarios: {
    cast: {
      executor: "shared-iterations",
      vus: Number(__ENV.VUS || 50),
      iterations: DATA.voters.length,
      maxDuration: "10m",
    },
  },
  thresholds: {
    // Tune to your SLO; these are starting points, not guarantees.
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

// Build a valid ballot for a voter's grade: one (first) eligible candidate per
// eligible position. Abstentions are the implicit default for omitted positions.
function selectionsFor(gradeLevel) {
  const selections = {};
  for (const pos of DATA.positions) {
    if (pos.eligibleGrades.includes(gradeLevel) && pos.candidateIds.length > 0) {
      selections[pos.id] = pos.candidateIds[0];
    }
  }
  return selections;
}

export default function () {
  const voter = DATA.voters[exec.scenario.iterationInTest];
  if (!voter) return;

  const res = http.post(
    `${BASE_URL}/api/test/cast-ballot`,
    JSON.stringify({ voterId: voter.id, selections: selectionsFor(voter.gradeLevel) }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, {
    "status 200": (r) => r.status === 200,
    "cast succeeded": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
  });
}
