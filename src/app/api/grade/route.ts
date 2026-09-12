import { NextResponse } from "next/server";
import questionBank from "@/lib/questions.json";

const CONCEPTS = [
  "off_by_one",
  "null_handling",
  "scope_error",
  "type_mismatch",
  "logic_error",
] as const;

type Concept = (typeof CONCEPTS)[number];

type Question = {
  id: string;
  prompt: string;
  expected_understanding: string;
};

type GradeResult = {
  passed: boolean;
  what_you_got: string;
  specific_gap: string;
  memory_clue: string;
  next_step: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[`"'.,!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * This fallback exists for when Claude is unavailable.
 *
 * It does NOT try to guess mastery from keywords.
 * Instead, it recognizes a few obvious partial-answer states
 * and gives the student a concrete explanation.
 */
function fallbackGrade(
  answer: string,
  question: Question,
  concept: Concept,
  originalError?: string
): GradeResult {
  const normalized = normalize(answer);

  if (!normalized) {
    return {
      passed: false,
      what_you_got: "Start by explaining what you think is happening.",
      specific_gap:
        "There isn't an answer yet for Ledger to work with.",
      memory_clue:
        "Think back to the bug you originally logged. What was the AI fix changing?",
      next_step:
        "Give your best explanation, even if you're not completely sure.",
    };
  }

  /*
   * OFF-BY-ONE
   */
  if (concept === "off_by_one") {
    const identifiedCorrectRange =
      normalized.includes("range len") ||
      normalized.includes("range(len") ||
      normalized.includes("less than") ||
      normalized.includes("<");

    const understandsBoundary =
      normalized.includes("0") &&
      normalized.includes("9");

    const understandsWhy =
      normalized.includes("plus 1") ||
      normalized.includes("len list plus 1") ||
      normalized.includes("one past") ||
      normalized.includes("past the end") ||
      normalized.includes("outside") ||
      normalized.includes("invalid index") ||
      normalized.includes("out of range") ||
      normalized.includes("last index");

    /*
     * Student found the solution but did not explain the
     * underlying reason.
     */
    if (identifiedCorrectRange && !understandsWhy) {
      return {
        passed: false,

        what_you_got:
          "You got the range right.",

        specific_gap:
          "What's missing is why adding 1 goes too far. A list with 10 items has indexes 0 through 9. `range(len(list) + 1)` reaches 10, which is outside the valid indexes.",

        memory_clue:
          originalError
            ? "This is the same idea behind the bug you logged earlier: the loop was allowed to reach one position beyond the valid boundary."
            : "Think about the final index a list with 10 items can actually have.",

        next_step:
          "Try again: why is 10 not a valid index in a list with 10 items?",
      };
    }

    /*
     * Student understands the boundary but has not yet
     * clearly connected it to the range.
     */
    if (identifiedCorrectRange && understandsBoundary && !understandsWhy) {
      return {
        passed: false,

        what_you_got:
          "You identified the correct range and the valid indexes.",

        specific_gap:
          "Now connect those two ideas: `range(len(list) + 1)` includes one value beyond the last valid index.",

        memory_clue:
          "Your original bug had the same boundary problem: the loop was allowed to continue one step farther than it should.",

        next_step:
          "Explain what value the `+ 1` adds and why that value cannot be used as an index.",
      };
    }

    /*
     * Student gives a vague or incorrect answer.
     * Teach the underlying concept rather than simply saying
     * they don't understand it.
     */
    return {
      passed: false,

      what_you_got:
        "You're working with the right idea: the question is about where the loop should stop.",

      specific_gap:
        "The key idea is that list indexes start at 0. With 10 items, the valid indexes are 0 through 9. The number 10 is the length of the list, but it is not a valid index.",

      memory_clue:
        "Think back to your original loop. What happened when the counter was allowed to reach the length of the array?",

      next_step:
        "Now explain why adding 1 to the list length makes the range go one position too far.",
    };
  }

  /*
   * NULL HANDLING
   */
  if (concept === "null_handling") {
    const mentionsNull =
      normalized.includes("null") ||
      normalized.includes("none") ||
      normalized.includes("undefined");

    const mentionsCheck =
      normalized.includes("check") ||
      normalized.includes("guard") ||
      normalized.includes("before");

    if (mentionsNull && mentionsCheck) {
      return {
        passed: false,

        what_you_got:
          "You recognized that the value may be null and that it needs to be checked.",

        specific_gap:
          "The missing connection is why the check must happen before accessing the property: a null value does not have a `.name` property.",

        memory_clue:
          "Think back to the original bug: the code tried to read `.name` from a value that turned out to be null.",

        next_step:
          "Explain what happens if the program tries to access `.name` before confirming the user exists.",
      };
    }

    return {
      passed: false,

      what_you_got:
        "The important idea here is that the function may not return a usable object.",

      specific_gap:
        "If the result can be null, you need to account for that before accessing one of its properties.",

      memory_clue:
        "Think back to the original error. What value did the code try to access a property on?",

      next_step:
        "Explain what could happen when the returned value is null.",
    };
  }

  /*
   * SCOPE ERROR
   */
  if (concept === "scope_error") {
    return {
      passed: false,

      what_you_got:
        "You're looking at where the variable was created and where it is being used.",

      specific_gap:
        "The important idea is scope: a variable is only available in the parts of the program where it has been defined and is accessible.",

      memory_clue:
        "Think back to the original bug. Where was the variable created, and where was the code trying to use it?",

      next_step:
        "Explain why moving the variable or passing it into the function would make it accessible.",
    };
  }

  /*
   * TYPE MISMATCH
   */
  if (concept === "type_mismatch") {
    return {
      passed: false,

      what_you_got:
        "You're working with the values involved in the operation.",

      specific_gap:
        "The key idea is that the operation expects compatible types. Check what type each value actually is before deciding how to combine or use them.",

      memory_clue:
        "Think back to the original bug. What types were involved, and what operation was the code trying to perform?",

      next_step:
        "Name the types involved and explain whether they can be used together for the operation.",
    };
  }

  /*
   * LOGIC ERROR
   */
  if (concept === "logic_error") {
    return {
      passed: false,

      what_you_got:
        "You're looking at the behavior of the program rather than whether the code can run.",

      specific_gap:
        "The important idea is that code can run successfully while still making the wrong decision. The condition or algorithm needs to match the intended behavior.",

      memory_clue:
        "Think back to the original bug. What did the program actually do, and what was it supposed to do?",

      next_step:
        "Describe the intended behavior first, then compare it with what the current condition actually does.",
    };
  }

  return {
    passed: false,

    what_you_got:
      "Your answer gives Ledger something to work with.",

    specific_gap:
      `The concept being tested is ${concept.replace("_", " ")}. Explain the reasoning behind your answer.`,

    memory_clue:
      "Think back to the original bug and what the AI changed to fix it.",

    next_step:
      "Try again in your own words and explain why your approach works.",
  };
}

export async function POST(req: Request) {
  try {
    const {
      entry_id,
      concept,
      question_id,
      user_answer,
      original_error,
      ai_fix_summary,
    } = await req.json();

    if (!concept || !question_id || !user_answer) {
      return NextResponse.json(
        {
          error: "Concept, question, and answer are required.",
        },
        { status: 400 }
      );
    }

    if (!CONCEPTS.includes(concept as Concept)) {
      return NextResponse.json(
        {
          error: "Invalid concept.",
        },
        { status: 400 }
      );
    }

    const typedConcept = concept as Concept;

    const questionSet =
      questionBank[
        typedConcept as keyof typeof questionBank
      ] as readonly Question[];

    const question = questionSet?.find(
      (item) => item.id === question_id
    );

    if (!question) {
      return NextResponse.json(
        {
          error: `Question "${question_id}" was not found for concept "${typedConcept}".`,
        },
        { status: 404 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    /*
     * If Claude is unavailable, use the specific teaching
     * fallback above rather than generic grading language.
     */
    if (!apiKey) {
      return NextResponse.json(
        fallbackGrade(
          user_answer,
          question,
          typedConcept,
          original_error
        )
      );
    }

    const prompt = `
You are Ledger's learning coach.

Ledger helps students understand what they actually know
after using AI to solve coding problems.

The student previously used AI to solve a bug.
Now they are answering a different question about the
same underlying concept.

Your job is NOT simply to grade them.

Your job is to understand their answer and help them
close the specific gap between their current understanding
and the underlying concept.

CONCEPT:
${typedConcept}

ORIGINAL BUG:
${original_error || "Not provided"}

AI FIX SUMMARY:
${ai_fix_summary || "Not provided"}

TRANSFER QUESTION:
${question.prompt}

EXPECTED UNDERSTANDING:
${question.expected_understanding}

STUDENT ANSWER:
${user_answer}

IMPORTANT RULES:

1. Do not grade based on keywords.

2. Do not say:
"Ledger could not confidently verify independent understanding."

3. Do not give generic feedback.

4. Identify exactly what the student got right.

5. Identify exactly what is missing.

6. Connect the missing idea to the original bug when useful.

7. If the student is partially correct, say exactly what they got
   and exactly what they need to connect.

8. If the student does not understand the concept, teach the
   underlying idea in simple language and then give them a
   question that lets them try again.

9. Never shame the student.

10. Do not use:
bad, weak, failed, wrong, poor, struggling, risk, danger.

11. A correct answer should PASS even if it uses different wording.

12. A concise answer can PASS if it demonstrates the underlying
    concept.

13. The purpose is learning, not testing for its own sake.

For a partially correct answer, the response should feel like:

"Almost there. You got X right. The missing piece is Y.
Here's how that connects to the bug you originally logged.
Try this: Z."

For a student who does not understand, it should feel like:

"Let's work through it. The key idea is X.
In your original bug, Y happened.
Now try this: Z."

For a correct answer, it should feel like:

"Proven. You understand X.
You used to need help with this — not anymore."

Return ONLY valid JSON:

{
  "passed": true or false,
  "what_you_got": "specific explanation of what the student understood",
  "specific_gap": "specific explanation of what is missing; empty if passed",
  "memory_clue": "specific connection to the original bug; empty if passed",
  "next_step": "one clear next action"
}
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

            max_tokens: 700,

            temperature: 0,

            system:
              "You are Ledger's precise learning coach. Return valid JSON only. Never return markdown.",

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

      if (!text) {
        throw new Error("Claude returned an empty response");
      }

      let parsed: GradeResult;

      try {
        parsed = JSON.parse(text);
      } catch {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");

        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("Invalid JSON");
        }

        parsed = JSON.parse(
          text.slice(jsonStart, jsonEnd + 1)
        );
      }

      if (
        typeof parsed.passed !== "boolean" ||
        typeof parsed.what_you_got !== "string" ||
        typeof parsed.specific_gap !== "string" ||
        typeof parsed.memory_clue !== "string" ||
        typeof parsed.next_step !== "string"
      ) {
        throw new Error("Invalid grading response");
      }

      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        fallbackGrade(
          user_answer,
          question,
          typedConcept,
          original_error
        )
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "Unable to grade this answer.",
      },
      { status: 500 }
    );
  }
}