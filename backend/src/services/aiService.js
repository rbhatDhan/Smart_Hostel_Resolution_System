
// aiService.js

// Thin wrapper around the Google Gemini API used by all AI features:
//
// 1. classifyAndAssessUrgency -> auto-title + auto-categorization +
//    priority + safety-urgency check
//
// 2. findDuplicateComplaints -> duplicate/similar complaint detection
//
// 3. generateInsightsSummary -> AI-written analytics summary
//    for wardens/admins

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Furniture",
  "Washroom",
  "WiFi",
  "Cleaning",
  "Security",
  "Other",
];

/**
 * Low-level call to the Gemini generateContent API.
 */
async function callGemini(system, userMessage, maxOutputTokens = 400) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const response = await fetch(
    `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(15000), // never hang a request on a slow AI call
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }],
        },

        contents: [
          {
            parts: [{ text: userMessage }],
          },
        ],

        generationConfig: {
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();

    throw new Error(
      `Gemini API error ${response.status}: ${errText}`
    );
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return text;
}

/**
 * Strips markdown fences and parses JSON.
 */
function safeParseJSON(raw) {
  if (!raw) return null;

  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);

    const candidate =
      objMatch?.[0] || arrMatch?.[0];

    if (!candidate) return null;

    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

/**
 * FEATURE 1 + 3:
 *
 * Automatically:
 * - Generates complaint title
 * - Classifies category
 * - Predicts priority
 * - Detects safety-critical urgency
 */
export const classifyAndAssessUrgency = async (description) => {

  const system = `You are an intelligent assistant for a college hostel complaint management system.

Given a student's complaint description, perform all of the following tasks:

1. Generate a short and clear complaint title.
2. Classify the complaint into exactly one category.
3. Assign an appropriate priority.
4. Determine whether it is an immediate safety or health emergency.

VALID CATEGORIES:
${CATEGORIES.join(", ")}

Choose exactly one category.

VALID PRIORITIES:
low, medium, high

Choose exactly one priority.

TITLE RULES:
- Generate a short descriptive title.
- Maximum 8 words.
- Clearly describe the main problem.
- Do not include room numbers.
- Do not include personal information.
- Do not use generic titles such as "Complaint", "Issue", or "Problem".
- Make the title useful for a warden viewing a complaint list.

URGENCY RULES:

Mark "isUrgent" as true ONLY for genuine safety or health hazards such as:
- exposed electrical wires
- sparking electrical wiring
- gas smell
- fire risk
- major flooding
- serious structural damage
- immediate security threat
- immediate danger to students

Do NOT mark routine issues as urgent, including:
- slow drainage
- minor leakage
- flickering bulb
- broken chair
- non-working tap
- normal WiFi issues
- regular cleaning issues

IMPORTANT:
- A major flooding situation can be urgent.
- A small or routine water leakage is normally not urgent.
- Priority should reflect how quickly the issue should be addressed.

Respond with ONLY a valid JSON object.

Use exactly this structure:

{
  "title": "short complaint title",
  "category": "one valid category",
  "priority": "low or medium or high",
  "isUrgent": true,
  "reason": "one short sentence explaining the decision"
}`;

  const raw = await callGemini(
    system,
    description,
    350
  );

  const parsed = safeParseJSON(raw);

  if (!parsed) {
    return null;
  }

  // Validate category
  if (!CATEGORIES.includes(parsed.category)) {
    parsed.category = "Other";
  }

  // Validate priority
  if (
    !["low", "medium", "high"].includes(
      parsed.priority
    )
  ) {
    parsed.priority = "medium";
  }

  // Validate title
  if (
    typeof parsed.title !== "string" ||
    !parsed.title.trim()
  ) {
    parsed.title = "Hostel Maintenance Issue";
  } else {
    parsed.title = parsed.title
      .trim()
      .split(/\s+/)
      .slice(0, 8)
      .join(" ");
  }

  // Validate urgency
  parsed.isUrgent =
    parsed.isUrgent === true;

  // Validate reason
  parsed.reason =
    typeof parsed.reason === "string"
      ? parsed.reason
      : "";

  return parsed;
};

/**
 * FEATURE 2:
 * Duplicate / similar complaint detection.
 *
 * candidates is a small pre-filtered list of
 * recent, open complaints.
 */
export const findDuplicateComplaints = async (
  description,
  candidates
) => {

  if (!candidates || candidates.length === 0) {
    return [];
  }

  const system = `You compare a NEW hostel complaint against a list of EXISTING open complaints.

Identify only complaints that describe the SAME underlying issue.

Examples of possible duplicates:
- Same broken equipment
- Same water leakage
- Same electrical outage
- Same problem affecting a room or block
- Same recurring maintenance problem

Do NOT mark complaints as duplicates merely because they belong to the same category.

Respond with ONLY a JSON array.

Each item must follow this structure:

{
  "id": "candidate id",
  "confidence": 0,
  "reason": "short reason"
}

Only include candidates where confidence is 60 or higher.

If there are no duplicates, respond with exactly:

[]`;

  const candidateList = candidates
    .map(
      (c) =>
        `id: ${c.id}
room: ${c.roomNumber}
description: ${c.description}`
    )
    .join("\n---\n");

  const userMsg = `NEW COMPLAINT:

${description}

EXISTING OPEN COMPLAINTS:

${candidateList}`;

  const raw = await callGemini(
    system,
    userMsg,
    500
  );

  const parsed = safeParseJSON(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (m) =>
      m &&
      m.id &&
      typeof m.confidence === "number" &&
      m.confidence >= 60
  );
};

/**
 * FEATURE 4:
 * AI-generated narrative summary for
 * the Analytics dashboard.
 */
export const generateInsightsSummary = async (
  stats
) => {

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server"
    );
  }

  const system = `You are an operations analyst for a college hostel complaint management system.

Given aggregated complaint statistics in JSON format, write a short plain-English summary.

Cover:

1. Overall complaint performance
2. Most problematic category
3. Any SLA breaches
4. One concrete actionable recommendation

Write 4 to 6 sentences.

Write like a human analyst.

Do not use markdown headings.
Do not use bullet points.
Do not simply repeat every number.`;

  const response = await fetch(
    `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(15000),

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }],
        },

        contents: [
          {
            parts: [
              {
                text: JSON.stringify(stats),
              },
            ],
          },
        ],

        generationConfig: {
          maxOutputTokens: 400,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();

    throw new Error(
      `Gemini API error ${response.status}: ${errText}`
    );
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  return text.trim();
};

