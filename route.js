import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

// ── Meta Graph API helpers ────────────────────────────────────
const META_BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || "v19.0"}`;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID; // e.g. "act_1234567890"
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const INSTAGRAM_ACTOR_ID = process.env.META_INSTAGRAM_ACTOR_ID;

/**
 * Generic Meta Graph API caller.
 * Throws on non-2xx with the Meta error message.
 */
async function metaPost(endpoint, body) {
  const url = `${META_BASE}/${endpoint}`;
  const params = new URLSearchParams({ access_token: ACCESS_TOKEN });

  const res = await fetch(`${url}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const msg =
      data.error?.message ||
      data.error?.error_user_msg ||
      `Meta API error at ${endpoint}`;
    console.error("Meta API error:", data.error);
    throw new Error(msg);
  }

  return data;
}

async function metaGet(endpoint, params = {}) {
  const url = `${META_BASE}/${endpoint}`;
  const query = new URLSearchParams({ access_token: ACCESS_TOKEN, ...params });
  const res = await fetch(`${url}?${query}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || "Meta GET error");
  return data;
}

// ── Step 1: Upload image URL to Meta Ad Images ────────────────
async function uploadImageFromUrl(imageUrl) {
  const data = await metaPost(`${AD_ACCOUNT}/adimages`, {
    url: imageUrl,
  });
  // Returns: { images: { <filename>: { hash, url, ... } } }
  const images = data.images;
  const firstKey = Object.keys(images)[0];
  return images[firstKey].hash;
}

// ── Step 2: Create Campaign ───────────────────────────────────
async function createCampaign(campaignName, objective) {
  const data = await metaPost(`${AD_ACCOUNT}/campaigns`, {
    name: campaignName,
    objective: objective, // e.g. "OUTCOME_TRAFFIC"
    status: "PAUSED", // Start paused so user can review in Ads Manager before live
    special_ad_categories: [],
    // Uncomment for spending cap: spend_cap: 10000,
  });
  return data.id; // campaign_id
}

// ── Step 3: Create Ad Set (targeting + budget) ────────────────
async function createAdSet({
  campaignId,
  adSetName,
  dailyBudgetCents,
  geoLocation,
  ageMin,
  ageMax,
  interests,
  objective,
  platforms,
}) {
  // Build placement / publisher platforms
  const publisherPlatforms = [];
  const facebookPositions = [];
  const instagramPositions = [];

  if (platforms?.includes("Facebook")) {
    publisherPlatforms.push("facebook");
    facebookPositions.push("feed", "story");
  }
  if (platforms?.includes("Instagram")) {
    publisherPlatforms.push("instagram");
    instagramPositions.push("stream", "story", "reels");
  }
  if (publisherPlatforms.length === 0) {
    publisherPlatforms.push("facebook", "instagram");
    facebookPositions.push("feed");
    instagramPositions.push("stream");
  }

  // Build interest targeting from interest names
  // In production you'd use /search?type=adinterest to resolve IDs
  // Here we provide a reasonable default structure
  const targetingSpec = {
    geo_locations: geoLocation || { countries: ["US"] },
    age_min: ageMin || 18,
    age_max: ageMax || 55,
    publisher_platforms: publisherPlatforms,
    ...(facebookPositions.length && { facebook_positions: facebookPositions }),
    ...(instagramPositions.length && { instagram_positions: instagramPositions }),
    // interests: interests?.map(name => ({ name })) || [],
  };

  // Map objective → billing event
  const billingEventMap = {
    OUTCOME_TRAFFIC: "IMPRESSIONS",
    OUTCOME_AWARENESS: "IMPRESSIONS",
    OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",
    OUTCOME_LEADS: "IMPRESSIONS",
    OUTCOME_SALES: "IMPRESSIONS",
  };
  const billingEvent = billingEventMap[objective] || "IMPRESSIONS";

  // Optimization goal
  const optimizationGoalMap = {
    OUTCOME_TRAFFIC: "LINK_CLICKS",
    OUTCOME_AWARENESS: "REACH",
    OUTCOME_ENGAGEMENT: "ENGAGEMENT",
    OUTCOME_LEADS: "LEAD_GENERATION",
    OUTCOME_SALES: "OFFSITE_CONVERSIONS",
  };
  const optimizationGoal = optimizationGoalMap[objective] || "LINK_CLICKS";

  // Schedule: run for 7 days from now
  const startTime = Math.floor(Date.now() / 1000) + 300; // 5 min from now
  const endTime = startTime + 7 * 24 * 60 * 60; // 7 days

  const data = await metaPost(`${AD_ACCOUNT}/adsets`, {
    name: adSetName,
    campaign_id: campaignId,
    daily_budget: dailyBudgetCents, // in account currency's smallest unit
    billing_event: billingEvent,
    optimization_goal: optimizationGoal,
    targeting: targetingSpec,
    status: "PAUSED",
    start_time: startTime,
    end_time: endTime,
  });

  return data.id; // adset_id
}

// ── Step 4: Create Ad Creative ────────────────────────────────
async function createAdCreative({
  creativeName,
  imageHash,
  caption,
  headline,
  callToAction,
  pageId,
  instagramActorId,
  linkUrl,
}) {
  const objectStorySpec = {
    page_id: pageId,
    link_data: {
      image_hash: imageHash,
      message: caption,
      name: headline || caption.substring(0, 40),
      call_to_action: {
        type: callToAction || "LEARN_MORE",
        value: {
          link: linkUrl || `https://www.facebook.com/${pageId}`,
        },
      },
      link: linkUrl || `https://www.facebook.com/${pageId}`,
    },
  };

  // If Instagram actor is configured, include it
  if (instagramActorId) {
    objectStorySpec.instagram_actor_id = instagramActorId;
  }

  const data = await metaPost(`${AD_ACCOUNT}/adcreatives`, {
    name: creativeName,
    object_story_spec: objectStorySpec,
    degrees_of_freedom_spec: {
      creative_features_spec: {
        standard_enhancements: { enroll_status: "OPT_OUT" }, // no auto-enhancements
      },
    },
  });

  return data.id; // creative_id
}

// ── Step 5: Create the Ad ─────────────────────────────────────
async function createAd({ adName, adSetId, creativeId }) {
  const data = await metaPost(`${AD_ACCOUNT}/ads`, {
    name: adName,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status: "PAUSED",
    tracking_specs: [
      {
        "action.type": ["offsite_conversion"],
        fb_pixel: [], // Add your pixel ID here if you have one
      },
    ],
  });
  return data.id; // ad_id
}

// ── Main POST handler ─────────────────────────────────────────
export async function POST(request) {
  try {
    // Validate env config
    if (!ACCESS_TOKEN || !AD_ACCOUNT || !PAGE_ID) {
      return NextResponse.json(
        {
          error:
            "Meta API credentials not configured. Check META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, and META_PAGE_ID in your .env.local",
        },
        { status: 503 }
      );
    }

    const { adData, imageUrl } = await request.json();

    if (!adData || !imageUrl) {
      return NextResponse.json(
        { error: "Missing adData or imageUrl" },
        { status: 400 }
      );
    }

    const {
      caption,
      headline,
      imagePrompt,
      geoLocation,
      dailyBudgetCents,
      ageMin,
      ageMax,
      interests,
      platforms,
      objective,
      callToAction,
      campaignName,
    } = adData;

    const timestamp = Date.now();
    const baseName = campaignName || "AI Generated Campaign";

    console.log(`[Meta Deploy] Starting deployment for: ${baseName}`);

    // ── 1. Upload image ───────────────────────────────────────
    console.log("[Meta Deploy] Uploading image...");
    const imageHash = await uploadImageFromUrl(imageUrl);
    console.log(`[Meta Deploy] Image hash: ${imageHash}`);

    // ── 2. Create campaign ────────────────────────────────────
    console.log("[Meta Deploy] Creating campaign...");
    const campaignId = await createCampaign(
      `${baseName} [${timestamp}]`,
      objective || "OUTCOME_TRAFFIC"
    );
    console.log(`[Meta Deploy] Campaign ID: ${campaignId}`);

    // ── 3. Create ad set ──────────────────────────────────────
    console.log("[Meta Deploy] Creating ad set...");
    const adSetId = await createAdSet({
      campaignId,
      adSetName: `${baseName} - Ad Set [${timestamp}]`,
      dailyBudgetCents: dailyBudgetCents || 1000,
      geoLocation,
      ageMin,
      ageMax,
      interests,
      objective: objective || "OUTCOME_TRAFFIC",
      platforms,
    });
    console.log(`[Meta Deploy] Ad Set ID: ${adSetId}`);

    // ── 4. Create ad creative ─────────────────────────────────
    console.log("[Meta Deploy] Creating ad creative...");
    const creativeId = await createAdCreative({
      creativeName: `${baseName} - Creative [${timestamp}]`,
      imageHash,
      caption,
      headline,
      callToAction: callToAction || "LEARN_MORE",
      pageId: PAGE_ID,
      instagramActorId: INSTAGRAM_ACTOR_ID || null,
      linkUrl: `https://www.facebook.com/${PAGE_ID}`,
    });
    console.log(`[Meta Deploy] Creative ID: ${creativeId}`);

    // ── 5. Create ad ──────────────────────────────────────────
    console.log("[Meta Deploy] Creating ad...");
    const adId = await createAd({
      adName: `${baseName} - Ad [${timestamp}]`,
      adSetId,
      creativeId,
    });
    console.log(`[Meta Deploy] Ad ID: ${adId}`);

    // ── Return result ─────────────────────────────────────────
    return NextResponse.json({
      success: true,
      campaignId,
      adSetId,
      creativeId,
      adId,
      campaignName: `${baseName}`,
      adAccountId: AD_ACCOUNT,
      status: "PAUSED", // campaign starts paused for safety
      managerUrl: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${AD_ACCOUNT.replace("act_", "")}`,
      message:
        "Campaign created in PAUSED state. Activate it in Meta Ads Manager after review.",
    });
  } catch (error) {
    console.error("[Meta Deploy] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Meta API deployment failed",
        hint: "Check your Meta access token permissions: ads_management, ads_read, pages_read_engagement",
      },
      { status: 500 }
    );
  }
}
