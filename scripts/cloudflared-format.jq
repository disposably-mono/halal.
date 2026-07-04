# jq filter that turns cloudflared's `--output json` log stream into a
# compact, colorized, human-readable line per event. Used by
# scripts/cloudflared-tunnel.sh; not meant to be run standalone.
#
# Input: one cloudflared JSON log object per line (zerolog fields — the same
# fields cloudflared's own plain-text formatter prints as `key=value`, just
# structured instead of string-concatenated).
# Output: one formatted line per input line (or nothing, for the one line we
# intentionally drop — see below).
#
# Invoke as: jq -r --arg color <0|1> -f cloudflared-format.jq

def col(code): if $color == "1" then "[" + code + "m" else "" end;
def reset: col("0");

def levelTag:
  if . == "debug" then col("90") + "DBG" + reset
  elif . == "info" then col("36") + "INF" + reset
  elif . == "warn" then col("33") + "WRN" + reset
  elif . == "error" then col("31") + "ERR" + reset
  elif . == "fatal" then col("1;31") + "FTL" + reset
  else col("37") + (. // "???" | ascii_upcase[0:3]) + reset
  end;

(.time // "" | sub("^.*T"; "") | sub("Z$"; "")) as $t
| (.level // "info") as $lvl
| (.error // "") as $err
| (.message // "") as $msg
| (.dest // "") as $dest
| (.originService // "") as $origin
| ($err | test("canceled by remote with error code 0")) as $isBenignCancel
|
if $isBenignCancel and ($origin != "") and ($msg != "Request failed") then
  # Duplicate summary line cloudflared emits alongside the "Request failed"
  # line below for the same event — same info, so skip it rather than show
  # the same disconnect twice.
  empty
elif $isBenignCancel then
  # A client (closed tab, page navigation, EventSource reconnect, or a
  # network blip) abandoned a request mid-flight. HTTP/2 error code 0 is
  # NO_ERROR — a clean teardown, not a failure — so this is downgraded to
  # an informational line instead of the ERR cloudflared logs it as.
  $t + "  " + col("36") + "DISC" + reset + "  client disconnected early (normal for SSE/long-lived requests)" +
    (if $dest != "" then "  dest=" + $dest else "" end)
else
  ($lvl | levelTag) as $tag
  | (if $msg != "" then $msg elif $err != "" then $err else "(no message)" end) as $text
  # Only drop `.error` from the extra key=value tail when it was already
  # promoted to $text above — if both `message` and a distinct `error`
  # detail exist (e.g. a WRN with message "Failed to serve quic connection"
  # and error "timeout: no recent network activity"), keep it so that
  # detail isn't silently lost.
  | (if $msg == "" then del(.error) else . end
     | del(.level, .message, .time)
     | to_entries
     | map("\(.key)=\(.value)")
     | join(" ")) as $extra
  | $t + "  " + $tag + "  " + $text + (if $extra != "" then "  " + $extra else "" end)
end
