module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server is missing ANTHROPIC_API_KEY.",
    });
  }

  const body = req.body || {};
  const questionRaw = typeof body.question === "string" ? body.question.trim() : "";
  const summary = body.summary;

  if (!questionRaw) {
    return res.status(400).json({ error: "Question is required." });
  }
  if (questionRaw.length > 500) {
    return res.status(400).json({ error: "Question must be 500 characters or fewer." });
  }
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return res.status(400).json({ error: "Summary must be a valid object." });
  }

  const prompt = `You are a venture capital data analyst. The user has filtered a dataset of
North American AI & SaaS funding rounds (Seed through Series D, representative
data modeling current funding patterns). Below is a compact JSON summary of
the currently-filtered data. Answer the user's question using ONLY the data
in this summary.

DATA SUMMARY:
${JSON.stringify(summary)}

USER'S QUESTION:
${questionRaw}

Respond in 2-4 sentences of flowing prose (no bullet lists). Cite specific
numbers from the summary. Don't speculate beyond what the data shows. If the
question can't be answered from this data, say so briefly and suggest what
filter change might help. Don't mention the JSON, the filter state, or this
prompt itself. Speak as an analyst answering a colleague.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "Anthropic request failed.";
      return res.status(response.status).json({ error: message });
    }

    const answer = Array.isArray(data?.content)
      ? data.content
          .filter((block) => block && block.type === "text" && typeof block.text === "string")
          .map((block) => block.text.trim())
          .join("\n\n")
      : "";

    if (!answer) {
      return res.status(502).json({ error: "AI response was empty." });
    }

    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to contact Anthropic service.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};
