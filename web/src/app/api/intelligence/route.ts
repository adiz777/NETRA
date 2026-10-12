import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "edge";

type LookupKind = "domain" | "ip" | "username" | "email";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

function validDomain(value: string) {
  return (
    value.length <= 253 &&
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)
  );
}

function validIp(value: string) {
  if (value.includes(":")) {
    return /^[0-9a-f:]+$/i.test(value) && value.includes(":");
  }

  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every(
      (part) => /^\d{1,3}$/.test(part) && Number(part) <= 255,
    )
  );
}

function validUsername(value: string) {
  return /^[a-zA-Z0-9._-]{1,39}$/.test(value);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();

  if (!verifySession(cookieStore.get(COOKIE_NAME)?.value)) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  let body: { kind?: string; query?: string };

  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID JSON BODY" }, 400);
  }

  const kind = String(body.kind ?? "") as LookupKind;
  const query = String(body.query ?? "").trim();

  if (!query || query.length > 320) {
    return json({ error: "QUERY REQUIRED (MAX 320 CHARACTERS)" }, 400);
  }

  try {
    if (kind === "domain") {
      const domain = query.toLowerCase().replace(/\.$/, "");

      if (!validDomain(domain)) {
        return json(
          { error: "ENTER A VALID DOMAIN, WITHOUT A URL PATH" },
          400,
        );
      }

      const [dns, certificates] = await Promise.all([
        fetch(
          "https://dns.google/resolve?name=" +
            encodeURIComponent(domain) +
            "&type=A",
          { headers: { Accept: "application/dns-json" } },
        ),
        fetch(
          "https://crt.sh/?q=" +
            encodeURIComponent("%." + domain) +
            "&output=json",
          { headers: { Accept: "application/json" } },
        ),
      ]);

      const dnsData = dns.ok
        ? ((await dns.json()) as {
            Status?: number;
            Answer?: Array<{
              name: string;
              type: number;
              TTL: number;
              data: string;
            }>;
          })
        : null;

      let certs: Array<{
        name_value?: string;
        not_before?: string;
        not_after?: string;
      }> = [];

      if (certificates.ok) {
        try {
          certs = (
            (await certificates.json()) as typeof certs
          ).slice(0, 100);
        } catch {
          certs = [];
        }
      }

      const names = [
        ...new Set(
          certs
            .flatMap((cert) => (cert.name_value ?? "").split("\n"))
            .map((name) =>
              name.trim().replace(/^\*\./, ""),
            )
            .filter(
              (name) =>
                validDomain(name) &&
                (name === domain || name.endsWith("." + domain)),
            ),
        ),
      ].slice(0, 100);

      return json({
        kind,
        query: domain,
        fetchedAt: new Date().toISOString(),
        sources: ["Google Public DNS", "crt.sh Certificate Transparency"],
        dns: {
          status: dnsData?.Status ?? null,
          answers: dnsData?.Answer ?? [],
        },
        certificateNames: names,
        note: "Passive public-source results; certificate names do not prove a host is live.",
      });
    }

    if (kind === "ip") {
      if (!validIp(query)) {
        return json(
          { error: "ENTER A VALID IPv4 OR IPv6 ADDRESS" },
          400,
        );
      }

      const response = await fetch(
        "https://ipwho.is/" + encodeURIComponent(query),
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) {
        return json(
          { error: "IP INTELLIGENCE PROVIDER UNAVAILABLE" },
          502,
        );
      }

      const data = (await response.json()) as Record<string, unknown>;

      if (data.success === false) {
        return json(
          {
            error: "IP INTELLIGENCE LOOKUP FAILED",
            details: data.message ?? "Provider rejected the query",
          },
          422,
        );
      }

      const connection =
        data.connection && typeof data.connection === "object"
          ? data.connection
          : {};

      return json({
        kind,
        query,
        fetchedAt: new Date().toISOString(),
        source: "ipwho.is",
        data: {
          ip: data.ip,
          type: data.type,
          continent: data.continent,
          country: data.country,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          connection,
        },
        note: "Geolocation is approximate and should not be treated as a person's precise location.",
      });
    }

    if (kind === "username") {
      if (!validUsername(query)) {
        return json(
          {
            error:
              "USERNAME MAY CONTAIN LETTERS, NUMBERS, DOTS, DASHES OR UNDERSCORES",
          },
          400,
        );
      }

      const checks = await Promise.all([
        fetch(
          "https://api.github.com/users/" + encodeURIComponent(query),
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "NETRA-OSINT",
            },
          },
        ),
        fetch(
          "https://gitlab.com/api/v4/users?username=" +
            encodeURIComponent(query),
          { headers: { Accept: "application/json" } },
        ),
      ]);

      const results = await Promise.all(
        checks.map(async (response, index) => {
          const platform = index === 0 ? "GitHub" : "GitLab";

          if (response.status === 404) {
            return { platform, found: false };
          }

          if (!response.ok) {
            return {
              platform,
              found: null,
              error: "Provider unavailable",
            };
          }

          const data = (await response.json()) as
            | Record<string, unknown>
            | Array<Record<string, unknown>>;

          if (index === 0) {
            const user = data as Record<string, unknown>;

            return {
              platform: "GitHub",
              found: true,
              username: user.login,
              profileUrl: user.html_url,
              publicRepos: user.public_repos,
              createdAt: user.created_at,
            };
          }

          const users = data as Array<Record<string, unknown>>;
          const user = users.find(
            (item) =>
              String(item.username ?? "").toLowerCase() ===
              query.toLowerCase(),
          );

          return user
            ? {
                platform: "GitLab",
                found: true,
                username: user.username,
                profileUrl: user.web_url,
                createdAt: user.created_at,
              }
            : { platform: "GitLab", found: false };
        }),
      );

      return json({
        kind,
        query,
        fetchedAt: new Date().toISOString(),
        sources: ["GitHub public API", "GitLab public API"],
        results,
        note: "A matching username does not establish that profiles belong to the same person.",
      });
    }

    if (kind === "email") {
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) ||
        query.length > 254
      ) {
        return json({ error: "ENTER A VALID EMAIL ADDRESS" }, 400);
      }

      const key = process.env.HIBP_API_KEY;

      if (!key) {
        return json(
          {
            error:
              "EMAIL EXPOSURE CHECK IS NOT CONFIGURED. Add HIBP_API_KEY to Worker secrets; NETRA does not send email addresses to unconfigured providers.",
          },
          503,
        );
      }

      const response = await fetch(
        "https://haveibeenpwned.com/api/v3/breachedaccount/" +
          encodeURIComponent(query) +
          "?truncateResponse=false",
        {
          headers: {
            "hibp-api-key": key,
            "user-agent": "NETRA-Exposure-Check",
            Accept: "application/json",
          },
        },
      );

      if (response.status === 404) {
        return json({
          kind,
          query,
          checkedAt: new Date().toISOString(),
          breachCount: 0,
          breaches: [],
          source: "Have I Been Pwned",
          note: "No results returned by this provider; this is not proof of zero exposure everywhere.",
        });
      }

      if (response.status === 401 || response.status === 403) {
        return json(
          { error: "HIBP API KEY INVALID OR NOT AUTHORISED" },
          502,
        );
      }

      if (!response.ok) {
        return json(
          {
            error: "EMAIL EXPOSURE PROVIDER UNAVAILABLE",
            status: response.status,
          },
          502,
        );
      }

      const breaches =
        (await response.json()) as Array<Record<string, unknown>>;

      return json({
        kind,
        query,
        checkedAt: new Date().toISOString(),
        breachCount: breaches.length,
        breaches: breaches.map((breach) => ({
          name: breach.Name,
          domain: breach.Domain,
          breachDate: breach.BreachDate,
          addedDate: breach.AddedDate,
          dataClasses: breach.DataClasses,
        })),
        source: "Have I Been Pwned",
        note: "Only check addresses you own or are authorised to investigate.",
      });
    }

    return json(
      { error: "SUPPORTED LOOKUP TYPES: domain, ip, username, email" },
      400,
    );
  } catch {
    return json(
      { error: "INTELLIGENCE PROVIDER REQUEST FAILED" },
      502,
    );
  }
}