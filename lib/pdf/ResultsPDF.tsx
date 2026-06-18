/**
 * lib/pdf/ResultsPDF.tsx
 *
 * React-PDF document component for official COMELEC election results.
 * Rendered server-side by the /api/elections/[id]/results-pdf route handler.
 *
 * Install: npm install @react-pdf/renderer
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResultCandidate = {
  id: string;
  fullName: string;
  votes: number;
  isWinner: boolean;
  isTie: boolean;
};

export type ResultPosition = {
  id: string;
  title: string;
  candidates: ResultCandidate[];
  abstentions: number;
  totalVoters: number;
};

export type ResultsPDFProps = {
  electionName: string;
  division: string;
  schoolYear: string;
  dateClosed: string; // pre-formatted, e.g. "April 4, 2026"
  generatedAt: string; // pre-formatted timestamp
  positions: ResultPosition[];
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const NAVY = "#0f2044";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#f0d080";
const WHITE = "#ffffff";
const LIGHT_BG = "#f5f7fb";
const BORDER = "#d0d8e8";
const TEXT_DARK = "#1a2540";
const TEXT_MID = "#4a5568";
const TEXT_LIGHT = "#718096";
const WON_BG = "#e6f4ea";
const WON_TEXT = "#1a6b35";
const ROW_ALT = "#f9fafc";

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    paddingBottom: 60,
  },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 22,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    backgroundColor: GOLD,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  headerBadgeText: {
    color: NAVY,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: GOLD_LIGHT,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    marginBottom: 2,
    textAlign: "right",
  },
  headerMetaValue: {
    color: GOLD_LIGHT,
    fontSize: 8,
    textAlign: "right",
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    opacity: 0.4,
    marginTop: 10,
  },

  // Summary bar
  summaryBar: {
    backgroundColor: LIGHT_BG,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 24,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: {
    color: TEXT_LIGHT,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  summaryValue: {
    color: TEXT_DARK,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },

  // Position block
  positionBlock: {
    marginBottom: 20,
  },
  positionHeader: {
    backgroundColor: NAVY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  positionTitle: {
    color: WHITE,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  positionVoterCount: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 7.5,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 0,
    overflow: "hidden",
  },
  tableColHeader: {
    flexDirection: "row",
    backgroundColor: "#e8edf5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableColHeaderText: {
    color: TEXT_LIGHT,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f5",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: ROW_ALT,
  },
  tableRowWinner: {
    backgroundColor: WON_BG,
  },
  tableRowAbstention: {
    backgroundColor: "#fdfaf3",
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  // Columns
  colName: { flex: 1 },
  colVotes: { width: 52, textAlign: "right" },
  colPct: { width: 44, textAlign: "right" },
  colStatus: { width: 54, textAlign: "right" },

  cellName: {
    color: TEXT_DARK,
    fontSize: 9,
  },
  cellNameWinner: {
    color: WON_TEXT,
    fontFamily: "Helvetica-Bold",
  },
  cellNameAbstention: {
    color: TEXT_LIGHT,
    fontStyle: "italic",
    fontSize: 8.5,
  },
  cellVotes: {
    color: TEXT_DARK,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  cellPct: {
    color: TEXT_MID,
    fontSize: 8.5,
  },
  cellStatus: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  cellStatusWon: {
    color: WON_TEXT,
  },

  winnerStar: {
    color: GOLD,
    fontSize: 9,
    marginRight: 4,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: WHITE,
  },
  footerText: {
    color: TEXT_LIGHT,
    fontSize: 7,
  },
  footerBold: {
    color: TEXT_MID,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  pageNumber: {
    color: TEXT_LIGHT,
    fontSize: 7,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(votes: number, total: number): string {
  if (total === 0) return "—";
  return `${((votes / total) * 100).toFixed(1)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PositionTable({ position }: { position: ResultPosition }) {
  const totalVotes = position.candidates.reduce((s, c) => s + c.votes, 0);
  // Total ballots cast for this position = votes + abstentions
  const totalCast = totalVotes + position.abstentions;

  return (
    <View style={s.positionBlock} wrap={false}>
      {/* Position header */}
      <View style={s.positionHeader}>
        <Text style={s.positionTitle}>{position.title}</Text>
        <Text style={s.positionVoterCount}>
          {totalCast} / {position.totalVoters} voters cast ballot
        </Text>
      </View>

      {/* Table */}
      <View style={s.table}>
        {/* Column headers */}
        <View style={s.tableColHeader}>
          <View style={s.colName}>
            <Text style={s.tableColHeaderText}>Candidate</Text>
          </View>
          <View style={s.colVotes}>
            <Text style={s.tableColHeaderText}>Votes</Text>
          </View>
          <View style={s.colPct}>
            <Text style={s.tableColHeaderText}>% Cast</Text>
          </View>
          <View style={s.colStatus}>
            <Text style={s.tableColHeaderText}>Result</Text>
          </View>
        </View>

        {/* Candidate rows */}
        {position.candidates.map((c, i) => (
          <View
            key={c.id}
            style={[
              s.tableRow,
              c.isWinner ? s.tableRowWinner : i % 2 !== 0 ? s.tableRowAlt : {},
            ]}
          >
            <View style={[s.colName, { flexDirection: "row", alignItems: "center" }]}>
              {c.isWinner && <Text style={s.winnerStar}>★</Text>}
              <Text style={[s.cellName, c.isWinner ? s.cellNameWinner : {}]}>
                {c.fullName}
              </Text>
            </View>
            <View style={s.colVotes}>
              <Text style={s.cellVotes}>{c.votes.toLocaleString()}</Text>
            </View>
            <View style={s.colPct}>
              <Text style={s.cellPct}>{pct(c.votes, totalCast)}</Text>
            </View>
            <View style={s.colStatus}>
              {c.isTie ? (
                <Text style={[s.cellStatus, s.cellStatusWon]}>TIE</Text>
              ) : c.isWinner ? (
                <Text style={[s.cellStatus, s.cellStatusWon]}>WON</Text>
              ) : (
                <Text style={{ ...s.cellStatus, color: TEXT_LIGHT }}>—</Text>
              )}
            </View>
          </View>
        ))}

        {/* Abstentions row */}
        <View style={[s.tableRow, s.tableRowAbstention]}>
          <View style={s.colName}>
            <Text style={s.cellNameAbstention}>Abstentions</Text>
          </View>
          <View style={s.colVotes}>
            <Text style={{ ...s.cellVotes, color: TEXT_LIGHT }}>
              {position.abstentions.toLocaleString()}
            </Text>
          </View>
          <View style={s.colPct}>
            <Text style={s.cellPct}>{pct(position.abstentions, position.totalVoters)}</Text>
          </View>
          <View style={s.colStatus}>
            <Text style={{ ...s.cellStatus, color: TEXT_LIGHT }}>—</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function ResultsPDF({
  electionName,
  division,
  schoolYear,
  dateClosed,
  generatedAt,
  positions,
}: ResultsPDFProps) {
  return (
    <Document
      title={`Official Results — ${electionName}`}
      author="COMELEC"
      subject="Election Results"
      creator="Election Management System"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header} fixed>
          <View style={s.headerTop}>
            <View style={s.headerLeft}>
              <View style={s.headerBadge}>
                <Text style={s.headerBadgeText}>Official Results</Text>
              </View>
              <Text style={s.headerTitle}>{electionName}</Text>
              <Text style={s.headerSubtitle}>
                {division} Division · S.Y. {schoolYear}
              </Text>
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerMeta}>Date Closed</Text>
              <Text style={s.headerMetaValue}>{dateClosed}</Text>
              <Text style={s.headerMeta}>Generated</Text>
              <Text style={s.headerMetaValue}>{generatedAt}</Text>
            </View>
          </View>
          <View style={s.divider} />
        </View>

        {/* ── Summary bar ── */}
        <View style={s.summaryBar} fixed>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Positions:</Text>
            <Text style={s.summaryValue}>{positions.length}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Total Candidates:</Text>
            <Text style={s.summaryValue}>
              {positions.reduce((s, p) => s + p.candidates.length, 0)}
            </Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>
          {positions.map((pos) => (
            <PositionTable key={pos.id} position={pos} />
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            <Text style={s.footerBold}>CONFIDENTIAL — FOR OFFICIAL USE ONLY</Text>
            {"  ·  "}Commission on Elections
          </Text>
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
