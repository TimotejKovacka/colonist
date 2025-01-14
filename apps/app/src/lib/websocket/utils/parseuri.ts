// MIT License

// Copyright (c) 2007-2024 Steven Levithan

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

//! parseUri 3.0.2; Steven Levithan; MIT License
/* A mighty but tiny URI/URN/URL parser; splits any URI into its parts (all of which are optional).
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  href                                                    │
├────────────────────────────────────────────────────────────────┬─────────────────────────────────────────┤
│                             origin                             │                resource                 │
├──────────┬─┬───────────────────────────────────────────────────┼──────────────────────┬───────┬──────────┤
│ protocol │ │                     authority                     │       pathname       │ query │ fragment │
│          │ ├─────────────────────┬─────────────────────────────┼───────────┬──────────┤       │          │
│          │ │      userinfo       │            host             │ directory │ filename │       │          │
│          │ ├──────────┬──────────┼──────────────────────┬──────┤           ├─┬────────┤       │          │
│          │ │ username │ password │       hostname       │ port │           │ │ suffix │       │          │
│          │ │          │          ├───────────┬──────────┤      │           │ ├────────┤       │          │
│          │ │          │          │ subdomain │  domain  │      │           │ │        │       │          │
│          │ │          │          │           ├────┬─────┤      │           │ │        │       │          │
│          │ │          │          │           │    │ tld │      │           │ │        │       │          │
"  https   ://   user   :   pass   @ sub1.sub2 . dom.com  : 8080   /p/a/t/h/  a.html    ?  q=1  #   hash   "
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
Also supports IPv4/IPv6 addresses, URNs, and many edge cases not shown here. Supports providing a
list of second-level domains that should be treated as part of the top-level domain (ex: co.uk) */

interface ParseUriObject {
  href: string;
  origin: string;
  protocol: string;
  authority: string;
  userinfo: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  subdomain: string;
  domain: string;
  tld: string;
  port: string;
  resource: string;
  pathname: string;
  directory: string;
  filename: string;
  suffix: string;
  query: string;
  fragment: string;
  queryParams: URLSearchParams;
}

/**
Splits any URI into its parts.
@param {string} uri
@param {'default' | 'friendly'} [mode] Parsing mode. Default follows official URI rules.
Friendly handles human-friendly URLs like `'example.com/index.html'` as expected.
@returns {ParseUriObject} Object with URI parts, plus `queryParams`.
*/
function parseUri(
  uri: string,
  mode: "default" | "friendly" = "default"
): ParseUriObject {
  uri = uri.trim();
  const match = cache.parser[mode].exec(uri);
  if (!match || !match.groups) {
    throw "Failed to properly parse uri";
  }
  const { groups } = match;
  // @ts-ignore
  const { hasAuth, ...result } = {
    href: uri,
    ...groups,
    // URNs: If we have an authority (contained in `hasAuth`), keep dir/file, else remove because
    // they don't apply. `hasAuth` indicates participation in the match, but it could be empty
    ...(groups.protocol && groups.hasAuth == null ? blankUrnProps : null),
  };
  const parsedUri: ParseUriObject = result as ParseUriObject;
  // Replace `undefined` for non-participating capturing groups
  (
    Object.keys(parsedUri) as Array<keyof Omit<ParseUriObject, "queryParams">>
  ).forEach((key) => (parsedUri[key] ??= ""));
  return Object.assign(parsedUri, {
    ...cache.tlds?.exec(parsedUri.hostname)?.groups,
    queryParams: new URLSearchParams(`?${parsedUri.query}`),
  });
}

const blankUrnProps = {
  directory: "",
  filename: "",
  suffix: "",
};

function getParser(mode: "default" | "friendly") {
  // Forward and backslashes have lost all meaning for web protocols (http, https, ws, wss, ftp)
  // and protocol-relative URLs. Also handle multiple colons in protocol delimiter for security
  const authorityDelimiter = String.raw`(?:(?:(?<=^(?:https?|wss?|ftp):):*|^:+)[\\/]*|^[\\/]{2,}|//)`;
  const authority = {
    default: { start: `(?<hasAuth>${authorityDelimiter}`, end: ")?" },
    friendly: { start: `(?<hasAuth>${authorityDelimiter}?)`, end: "" },
  };
  // See file: free-spacing-regex.md
  return RegExp(
    String.raw`^(?<origin>(?:(?<protocol>[a-z][^\s:@\\/?#.]*):)?${authority[mode].start}(?<authority>(?:(?<userinfo>(?<username>[^:@\\/?#]*)(?::(?<password>[^\\/?#]*))?)?@)?(?<host>(?<hostname>\d{1,3}(?:\.\d{1,3}){3}(?=[:\\/?#]|$)|\[[a-f\d]{0,4}(?::[a-f\d]{0,4}){2,7}(?:%[^\]]*)?\]|(?<subdomain>[^:\\/?#]*?)\.??(?<domain>(?:[^.:\\/?#]*\.)?(?<tld>[^.:\\/?#]*))(?=[:\\/?#]|$))?(?::(?<port>[^:\\/?#]*))?))${authority[mode].end})(?<resource>(?<pathname>(?<directory>(?:[^\\/?#]*[\\/])*)(?<filename>(?:[^.?#]+|\.(?![^.?#]+(?:[?#]|$)))*(?:\.(?<suffix>[^.?#]+))?))(?:\?(?<query>[^#]*))?(?:\#(?<fragment>.*))?)`,
    "i"
  );
}

const cache: {
  parser: {
    default: RegExp;
    friendly: RegExp;
  };
  tlds?: RegExp;
} = {
  parser: {
    default: getParser("default"),
    friendly: getParser("friendly"),
  },
};

/**
  Set second-level domains recognized as part of the TLD (ex: co.uk).
  @param {Object} obj Object with TLDs as keys and their SLDs as space-separated strings.
  @example
  setTlds({
    au: 'com edu gov id net org',
    uk: 'co gov me net org sch',
  });
  */
function setTlds(obj: Record<string, string>) {
  const entries = Object.entries(obj);
  let parser;
  if (entries.length) {
    const tlds = entries
      .map(
        ([key, value]) =>
          `(?:${value
            .trim()
            .replace(/\s+/g, "|")
            .replace(/\./g, "\\.")})\\.${key}`
      )
      .join("|");
    parser = RegExp(
      `^(?<subdomain>.*?)\\.??(?<domain>(?:[^.]*\\.)?(?<tld>${tlds}))$`,
      "is"
    );
  }
  cache.tlds = parser;
}
// Note: The library URI.js has a robust list that can be used directly by `setTlds`:
// > <script src="https://cdn.jsdelivr.net/npm/urijs@1.19.11/src/SecondLevelDomains.js"></script>
// > <script>parseUri.setTlds(SecondLevelDomains.list)</script>

export { parseUri, setTlds };
