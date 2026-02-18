import {
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
  type StringStream,
  type StreamParser,
} from "@codemirror/language"
import { LanguageSupport } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import type { Extension } from "@codemirror/state"

// Tabular operators supported in DCR transformations
const OPERATORS = new Set([
  "extend", "project", "print", "where", "parse",
  "project-away", "project-rename", "datatable", "columnifexists",
])

// Statement keywords
const KEYWORDS = new Set([
  "let", "source", "and", "or", "not", "in", "between",
  "contains", "contains_cs", "has", "has_cs",
  "startswith", "startswith_cs", "endswith", "endswith_cs",
  "matches", "regex", "true", "false",
])

// Scalar functions supported in DCR transformations
const FUNCTIONS = new Set([
  // Conversion
  "tobool", "todatetime", "todouble", "toreal", "toguid", "toint", "tolong",
  "tostring", "totimespan",
  // DateTime / TimeSpan
  "ago", "datetime_add", "datetime_diff", "datetime_part",
  "dayofmonth", "dayofweek", "dayofyear",
  "endofday", "endofmonth", "endofweek", "endofyear",
  "getmonth", "getyear", "hourofday",
  "make_datetime", "make_timespan", "now",
  "startofday", "startofmonth", "startofweek", "startofyear",
  "weekofyear",
  // Dynamic / Array
  "array_concat", "array_length", "pack_array", "pack",
  "parse_json", "parse_xml", "zip",
  // Math
  "abs", "bin", "floor", "ceiling", "exp", "exp10", "exp2",
  "isfinite", "isinf", "isnan", "log", "log10", "log2",
  "pow", "round", "sign",
  // Conditional
  "case", "iif", "max_of", "min_of",
  // String
  "base64_encodestring", "base64_decodestring",
  "countof", "extract", "extract_all", "indexof",
  "isempty", "isnotempty", "split", "strcat", "strcat_delim",
  "strlen", "substring", "tolower", "toupper", "hash_sha256",
  // Type
  "gettype", "isnotnull", "isnull",
  // Bitwise
  "binary_and", "binary_or", "binary_not", "binary_xor",
  "binary_shift_left", "binary_shift_right",
  // Special transformation functions
  "parse_cef_dictionary", "geo_location",
])

// KQL type names
const TYPES = new Set([
  "string", "int", "long", "real", "bool", "datetime", "timespan",
  "dynamic", "guid", "decimal",
])

const kqlParser: StreamParser<{ inString: false | "'" | '"' }> = {
  startState() {
    return { inString: false }
  },

  token(stream: StringStream, state: { inString: false | "'" | '"' }): string | null {
    // Continue string from previous line
    if (state.inString) {
      const quote = state.inString
      while (!stream.eol()) {
        const ch = stream.next()
        if (ch === "\\") {
          stream.next()
        } else if (ch === quote) {
          state.inString = false
          return "string"
        }
      }
      return "string"
    }

    // Skip whitespace
    if (stream.eatSpace()) return null

    const ch = stream.peek()!

    // Line comment
    if (ch === "/" && stream.match("//")) {
      stream.skipToEnd()
      return "comment"
    }

    // Pipe operator — highlight distinctly
    if (ch === "|") {
      stream.next()
      return "punctuation"
    }

    // Strings
    if (ch === '"' || ch === "'") {
      stream.next()
      state.inString = ch as "'" | '"'
      while (!stream.eol()) {
        const c = stream.next()
        if (c === "\\") {
          stream.next()
        } else if (c === ch) {
          state.inString = false
          return "string"
        }
      }
      return "string"
    }

    // Numbers
    if (/\d/.test(ch)) {
      stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)
      return "number"
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      stream.match(/^[a-zA-Z_][\w-]*/)
      const word = stream.current()

      if (OPERATORS.has(word)) return "keyword"
      if (KEYWORDS.has(word)) return "keyword"
      if (TYPES.has(word)) return "typeName"
      if (FUNCTIONS.has(word)) return "keyword"

      return "variableName"
    }

    // Operators
    if (stream.match("==") || stream.match("!=") || stream.match("=~") || stream.match("!~")) {
      return "operator"
    }
    if (stream.match("<=") || stream.match(">=")) {
      return "operator"
    }

    // Single-char operators and punctuation
    stream.next()
    if ("+-*/%<>=!".includes(ch)) return "operator"
    if ("(){}[],;.".includes(ch)) return "punctuation"

    return null
  },
}

const kqlStreamLanguage = StreamLanguage.define(kqlParser)

// ── Light theme highlight style ──────────────────────
const kqlLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#7c3aed" },
  { tag: tags.string, color: "#059669" },
  { tag: tags.number, color: "#b45309" },
  { tag: tags.comment, color: "#6b7280", fontStyle: "italic" },
  { tag: tags.operator, color: "#be185d" },
  { tag: tags.punctuation, color: "#6b6784" },
  { tag: tags.typeName, color: "#0369a1" },
  { tag: tags.variableName, color: "#0f0b24" },
])

// ── Dark theme highlight style ───────────────────────
const kqlDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c4b5fd" },
  { tag: tags.string, color: "#34d399" },
  { tag: tags.number, color: "#fbbf24" },
  { tag: tags.comment, color: "#8f8ba3", fontStyle: "italic" },
  { tag: tags.operator, color: "#f0abfc" },
  { tag: tags.punctuation, color: "#8f8ba3" },
  { tag: tags.typeName, color: "#67e8f9" },
  { tag: tags.variableName, color: "#f0eeff" },
])

export function kql(variant: "light" | "dark" = "light"): Extension[] {
  const highlight = variant === "dark" ? kqlDarkHighlight : kqlLightHighlight
  return [
    new LanguageSupport(kqlStreamLanguage),
    syntaxHighlighting(highlight),
  ]
}
