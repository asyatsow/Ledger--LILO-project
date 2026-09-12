import { NextResponse } from "next/server";

const CONCEPTS = [
  "off_by_one",
  "null_handling",
  "scope_error",
  "type_mismatch",
  "logic_error",
] as const;

type Concept = (typeof CONCEPTS)[number];

function detectFallback(code: string, error: string) {
  const text = `${code}\n${error}`.toLowerCase();

  // Off-by-one / boundary errors
  if (
    /<=\s*[\w.]+\.length/.test(text) ||
    /<\s*=\s*[\w.]+\.length/.test(text) ||
    text.includes("off-by-one") ||
    text.includes("index out of range") ||
    text.includes("indexerror")
  ) {
    return {
      concept: "off_by_one" as Concept,
      summary:
        "The loop boundary includes one position beyond the last valid array index.",
      fix: code.replace(
        /i\s*<=\s*arr\.length/g,
        "i < arr.length"
      ),
    };
  }

  // Null / undefined handling
  if (
    text.includes("cannot read properties of undefined") ||
    text.includes("cannot read properties of null") ||
    text.includes("cannot read property") ||
    text.includes("null") ||
    text.includes("undefined")
  ) {
    return {
      concept: "null_handling" as Concept,
      summary:
        "The code accesses a value before verifying that the value exists.",
      fix:
        "Check that the value is not null or undefined before accessing its properties or methods.",
    };
  }

  // Scope errors
  if (
    text.includes("is not defined") ||
    text.includes("referenceerror") ||
    text.includes("nameerror") ||
    text.includes("scope")
  ) {
    return {
      concept: "scope_error" as Concept,
      summary:
        "The code references a variable outside the scope where that variable is defined.",
      fix:
        "Move the variable declaration into the required scope or pass the value into that scope explicitly.",
    };
  }

  // Type errors
  if (
    text.includes("typeerror") ||
    text.includes("type mismatch") ||
    text.includes("cannot read") && text.includes("method")
  ) {
    return {
      concept: "type_mismatch" as Concept,
      summary:
        "An operation is being performed on a value whose type does not support that operation.",
      fix:
        "Check the value's type before performing the operation and convert it when appropriate.",
    };
  }

  // General logic errors
  return {
    concept: "logic_error" as Concept,
    summary:
      "The code runs into a logical problem where the implemented behavior does not match the intended behavior.",
    fix:
      "Compare the implemented condition or control flow with the intended behavior and correct the smallest incorrect condition.",
  };
}

export async function POST(req: Request) {
  try {
    const { code, error } = await req.json();

    if (!code || !error) {
      return NextResponse.json(
        { error: "Code and error are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Always provide a useful result, even if Claude is unavailable.
    const fallback = detectFallback(code, error);

    if (!apiKey) {
      return NextResponse.json(fallback);
    }

    const prompt = `
You are the debugging engine inside Ledger, a learning application for programmers.

Your job is NOT merely to describe the bug.

You must:
1. Identify what is actually wrong.
2. Produce a concrete correction or corrected code.
3. Identify the underlying CS concept the student should learn.
4. Explain the specific mistake in one concise sentence.

The concept MUST be exactly one of:
- off_by_one
- null_handling
- scope_error
- type_mismatch
- logic_error

IMPORTANT:
- Do not give generic advice.
- Do not say "inspect the failing operation."
- Do not say "make the smallest correction" without showing what the correction is.
- If code is provided, prefer showing the corrected code.
- The concept must describe the underlying transferable skill, not merely the error message.

Return ONLY valid JSON in exactly this shape:

{
  "fix": "the concrete corrected code or concrete correction",
  "concept": "one allowed concept",
  "summary": "one concise sentence explaining the actual mistake"
}

BUGGY CODE:
${code}

ERROR / TRACEBACK:
${error}
`;

    try {
      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model:
              process.env.ANTHROPIC_MODEL ||
              "claude-3-5-haiku-latest",
            max_tokens: 900,
            system:
              "You are a precise programming debugger. Return JSON only.",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Claude request failed");
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      const parsed = JSON.parse(text);

      if (
        !parsed.fix ||
        !parsed.summary ||
        !CONCEPTS.includes(parsed.concept)
      ) {
        throw new Error("Claude returned invalid Ledger response");
      }

      return NextResponse.json(parsed);
    } catch {
      // Claude failed, but Ledger still gives the user a useful diagnosis.
      return NextResponse.json(fallback);
    }
  } catch {
    return NextResponse.json(
      { error: "Unable to analyze this bug." },
      { status: 500 }
    );
  }
}