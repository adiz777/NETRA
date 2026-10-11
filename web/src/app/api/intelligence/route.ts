import { NextResponse } from "next/server";

export const runtime = "edge";

const jsonHeaders = { "Cache-Control": "no-store" };

function text(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  return NextResponse.json({
    integrations: [
      { id: "urlhaus", name: "URLhaus", category: "Threat intelligence", authentication: "None for public API", purpose: "Check a submitted URL against URLhaus malware distribution reports." },
      { id: "geocode", name: "Open-Meteo Geocoding", category: "Geographic context", authentication: "No API key for standard non-commercial use", purpose: "Find coordinates for a place name." },
      { id: "weather", name: "Open-Meteo Weather", category: "Environmental context", authentication: "No API key for standard non-commercial use", purpose: "Retrieve current weather for supplied coordinates." },
      { id: "news", name: "Hacker News Search", category: "Public web context", authentication: "Public search API", purpose: "Search public Hacker News posts by topic." },
    ],
  }, { headers: jsonHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action, 30);

    if (action === "urlhaus") {
      const rawUrl = text(body.url, 2048);
      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return NextResponse.json({ error: "ENTER A VALID HTTP OR HTTPS URL" }, { status: 400 });
      }
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
        return NextResponse.json({ error: "ONLY PUBLIC HTTP OR HTTPS URLS ARE SUPPORTED" }, { status: 400 });
      }

      const form = new URLSearchParams({ url: parsed.toString() });
      const response = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "NETRA-Intelligence-Platform/1.0" },
        body: form.toString(),
      });
      if (!response.ok) return NextResponse.json({ error: `URLhaus returned HTTP ${response.status}` }, { status: 502 });
      const data = await response.json() as Record<string, unknown>;
      return NextResponse.json({
        action,
        source: "URLhaus (abuse.ch)",
        checkedAt: new Date().toISOString(),
        result: data,
        caveat: "A not-found result does not prove a URL is safe. This is one public threat feed, not a complete security verdict.",
      }, { headers: jsonHeaders });
    }

    if (action === "geocode") {
      const place = text(body.place, 120);
      if (place.length < 2) return NextResponse.json({ error: "ENTER A PLACE NAME" }, { status: 400 });
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({ name: place, count: "5", language: "en", format: "json" }).toString();
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) return NextResponse.json({ error: "GEOCODING PROVIDER UNAVAILABLE" }, { status: 502 });
      const data = await response.json() as { results?: Array<Record<string, unknown>> };
      return NextResponse.json({
        action, source: "Open-Meteo Geocoding", checkedAt: new Date().toISOString(),
        results: (data.results || []).map((item) => ({
          name: item.name, admin1: item.admin1, country: item.country, latitude: item.latitude, longitude: item.longitude, timezone: item.timezone,
        })),
        caveat: "Coordinates are approximate place matches. Confirm the location before relying on it.",
      }, { headers: jsonHeaders });
    }

    if (action === "weather") {
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json({ error: "VALID LATITUDE AND LONGITUDE ARE REQUIRED" }, { status: 400 });
      }
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: String(latitude), longitude: String(longitude), current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m", timezone: "auto",
      }).toString();
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) return NextResponse.json({ error: "WEATHER PROVIDER UNAVAILABLE" }, { status: 502 });
      return NextResponse.json({
        action, source: "Open-Meteo", checkedAt: new Date().toISOString(), result: await response.json(),
        caveat: "Environmental context only; weather data does not verify an event or an individual's presence.",
      }, { headers: jsonHeaders });
    }

    if (action === "news") {
      const query = text(body.query, 120);
      if (query.length < 2) return NextResponse.json({ error: "ENTER A TOPIC TO SEARCH" }, { status: 400 });
      const url = new URL("https://hn.algolia.com/api/v1/search");
      url.search = new URLSearchParams({ query, tags: "story", hitsPerPage: "8" }).toString();
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) return NextResponse.json({ error: "PUBLIC SEARCH PROVIDER UNAVAILABLE" }, { status: 502 });
      const data = await response.json() as { hits?: Array<Record<string, unknown>> };
      return NextResponse.json({
        action, source: "Hacker News Search API", checkedAt: new Date().toISOString(),
        results: (data.hits || []).map((hit) => ({
          title: hit.title, url: hit.url, createdAt: hit.created_at, points: hit.points, author: hit.author,
        })),
        caveat: "Results are community-submitted technology stories, not a comprehensive news service or proof of a claim.",
      }, { headers: jsonHeaders });
    }

    return NextResponse.json({ error: "UNKNOWN INTELLIGENCE ACTION" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "PUBLIC INTELLIGENCE REQUEST FAILED" }, { status: 502 });
  }
}
