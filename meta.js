/**
 * meta.js — Reusable Meta Graph API utilities
 * Used by the deploy-ad route and any future Meta integrations.
 */

const META_VERSION = process.env.META_API_VERSION || "v19.0";
const BASE_URL = `https://graph.facebook.com/${META_VERSION}`;

/**
 * Make a GET request to the Meta Graph API.
 */
export async function metaGet(endpoint, params = {}, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  const query = new URLSearchParams({ access_token: token, ...params });
  const res = await fetch(`${BASE_URL}/${endpoint}?${query}`);
  return handleMetaResponse(res, endpoint);
}

/**
 * Make a POST request to the Meta Graph API.
 */
export async function metaPost(endpoint, body = {}, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  const query = new URLSearchParams({ access_token: token });
  const res = await fetch(`${BASE_URL}/${endpoint}?${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleMetaResponse(res, endpoint);
}

/**
 * Make a DELETE request to the Meta Graph API.
 */
export async function metaDelete(endpoint, accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  const query = new URLSearchParams({ access_token: token });
  const res = await fetch(`${BASE_URL}/${endpoint}?${query}`, {
    method: "DELETE",
  });
  return handleMetaResponse(res, endpoint);
}

async function handleMetaResponse(res, endpoint) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Meta API returned non-JSON response for ${endpoint}`);
  }

  if (data.error) {
    const e = data.error;
    const msg = e.error_user_msg || e.message || "Unknown Meta API error";
    const err = new Error(msg);
    err.code = e.code;
    err.type = e.type;
    err.fbtrace = e.fbtrace_id;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Meta API HTTP ${res.status} at ${endpoint}`);
  }

  return data;
}

/**
 * Search Meta interest targeting options by name.
 * Use this to resolve interest names → IDs for precise targeting.
 */
export async function searchInterests(query, adAccountId, accessToken) {
  const accountId = adAccountId || process.env.META_AD_ACCOUNT_ID;
  const data = await metaGet("search", {
    type: "adinterest",
    q: query,
    limit: 5,
    ad_account_id: accountId,
  }, accessToken);
  return data.data || [];
}

/**
 * Verify the access token is valid and has required permissions.
 */
export async function verifyToken(accessToken) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  const data = await metaGet("me", { fields: "id,name" }, token);
  return data;
}

/**
 * Get all ad accounts the token has access to.
 */
export async function getAdAccounts(accessToken) {
  const data = await metaGet("me/adaccounts", {
    fields: "id,name,currency,account_status",
  }, accessToken);
  return data.data || [];
}

/**
 * Map a country name to its ISO-3166-1 alpha-2 code.
 * Extend this map as needed.
 */
export function countryNameToCode(name) {
  const map = {
    "united states": "US", usa: "US", "us": "US",
    "united kingdom": "GB", uk: "GB",
    india: "IN",
    canada: "CA",
    australia: "AU",
    germany: "DE",
    france: "FR",
    singapore: "SG",
    "united arab emirates": "AE", uae: "AE",
    brazil: "BR",
    japan: "JP",
    indonesia: "ID",
    mexico: "MX",
    nigeria: "NG",
    "south africa": "ZA",
    kenya: "KE",
    pakistan: "PK",
    bangladesh: "BD",
    "saudi arabia": "SA",
    egypt: "EG",
    philippines: "PH",
    "new zealand": "NZ",
    netherlands: "NL",
    italy: "IT",
    spain: "ES",
  };
  return map[name?.toLowerCase()] || "US";
}
