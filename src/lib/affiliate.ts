/**
 * Affiliate partner registry.
 *
 * Every outbound monetized click routes through /api/go/[partner] so the
 * click is attributed in affiliate_clicks before the 307 redirect fires.
 * IDs below are read from env in production; the values here are the
 * fallback placeholders you swap once your network accounts are approved.
 */

export type PartnerKey =
  | "nordvpn"
  | "surfshark"
  | "prime"
  | "apple"
  | "bms"
  | "youtube"
  | "google";

export interface Partner {
  key: PartnerKey;
  network: string;
  commission: string;
  category: "vpn" | "stream";
  buildUrl: (titleQuery: string, slug: string) => string;
}

const AFF_ID_NORD = process.env.NORDVPN_AFF_ID ?? "1000001";
const AFF_ID_SURFSHARK = process.env.SURFSHARK_AFF_ID ?? "2000002";
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG ?? "omniscope-21";
const APPLE_AT = process.env.APPLE_AFFILIATE_TOKEN ?? "11l3KP";

const utm = (campaign: string, slug: string) =>
  `utm_source=omniscope&utm_medium=affiliate&utm_campaign=${encodeURIComponent(
    campaign
  )}&utm_content=${encodeURIComponent(slug)}`;

export const PARTNERS: Record<PartnerKey, Partner> = {
  nordvpn: {
    key: "nordvpn",
    network: "Impact",
    commission: "$30–$45 / 2-yr plan",
    category: "vpn",
    buildUrl: (_q, slug) =>
      `https://go.nordvpn.net/aff_c?aff_id=${AFF_ID_NORD}&aff_sub=${encodeURIComponent(
        slug
      )}&${utm("vpn-region-unlock", slug)}`,
  },
  surfshark: {
    key: "surfshark",
    network: "Impact",
    commission: "$30–$40 / 2-yr plan",
    category: "vpn",
    buildUrl: (_q, slug) =>
      `https://surfshark.com/deals?aff_id=${AFF_ID_SURFSHARK}&subid=${encodeURIComponent(
        slug
      )}&${utm("vpn-region-unlock", slug)}`,
  },
  prime: {
    key: "prime",
    network: "Amazon Associates",
    commission: "4%–10% rev share",
    category: "stream",
    buildUrl: (q, slug) =>
      `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}&${utm(
        "ott-deeplink",
        slug
      )}`,
  },
  apple: {
    key: "apple",
    network: "Apple Performance Partners",
    commission: "2.5%–8% rev share",
    category: "stream",
    buildUrl: (q, slug) =>
      `https://tv.apple.com/search?term=${encodeURIComponent(q)}&at=${APPLE_AT}&${utm(
        "ott-deeplink",
        slug
      )}`,
  },
  bms: {
    key: "bms",
    network: "BookMyShow Partner Program",
    commission: "5% rev share",
    category: "stream",
    buildUrl: (q, slug) =>
      `https://in.bookmyshow.com/search/movies?query=${encodeURIComponent(q)}&${utm(
        "ott-deeplink",
        slug
      )}`,
  },
  youtube: {
    key: "youtube",
    network: "direct",
    commission: "—",
    category: "stream",
    buildUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
  google: {
    key: "google",
    network: "direct",
    commission: "—",
    category: "stream",
    buildUrl: (q, slug) =>
      `https://play.google.com/store/search?q=${encodeURIComponent(q)}&c=movies&${utm(
        "ott-deeplink",
        slug
      )}`,
  },
};

export function isPartner(key: string): key is PartnerKey {
  return Object.prototype.hasOwnProperty.call(PARTNERS, key);
}

/** Internal tracked link used across all UI surfaces. */
export function goHref(partner: PartnerKey, slug: string): string {
  return `/api/go/${partner}?t=${encodeURIComponent(slug)}`;
}
