import { StreamLanguage, type StringStream, type StreamParser } from "@codemirror/language"
import { LanguageSupport } from "@codemirror/language"

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

    // Timespan literals like 1d, 2h, 30m, 15s
    if (/\d/.test(ch)) {
      stream.match(/^\d+[dhms]/)
      return "number"
    }

    // datetime(...) literal content is handled as a function call

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      stream.match(/^[a-zA-Z_][\w-]*/)
      const word = stream.current()

      if (OPERATORS.has(word)) return "keyword"
      if (KEYWORDS.has(word)) return "keyword"
      if (TYPES.has(word)) return "typeName"
      if (FUNCTIONS.has(word)) {
        // Check if followed by ( to confirm it's a function call
        if (stream.peek() === "(") return "keyword"
        // Still highlight known functions even without parens
        return "keyword"
      }

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

export function kql(): LanguageSupport {
  return new LanguageSupport(kqlStreamLanguage)
}
