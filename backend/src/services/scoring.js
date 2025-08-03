// backend/src/services/scoring.js

function normalizeScaleAnswer(value) {
  const v = Math.max(1, Math.min(5, value));
  return (v - 1) / 4;
}

function computeKeywordScore(expectedKeywords = [], transcript = '', providedMatches = []) {
  // If the reviewer supplies matched keywords, use those; otherwise auto-detect from transcript.
  const matches = (providedMatches && providedMatches.length)
    ? providedMatches.map(m => m.toLowerCase())
    : expectedKeywords
        .map(k => k.toLowerCase())
        .filter(k => transcript.toLowerCase().includes(k));

  if (!expectedKeywords.length) return 0;
  const uniqueMatches = Array.from(new Set(matches));
  const matchCount = uniqueMatches.length;
  return Math.min(1, matchCount / expectedKeywords.length);
}

/**
 * questions: array of {
 *   id, type, weight, mandatory, expected_keywords
 * }
 * answers: object keyed by question_id with structure depending on type:
 *   boolean: { answer_boolean: true/false }
 *   scale: { answer_scale: 1-5 }
 *   keyword_presence: { provided_matches: [...] } // optional
 *   text: { answer_text: "..." }
 *   multiple_choice: { selected_option_ids: [...] }
 *
 * transcript: string (used for keyword auto-detection)
 */
function scoreEvaluation(questions, answers, transcript = '') {
  let totalWeight = 0;
  let accumulated = 0;
  const missingMandatory = [];
  const perQuestion = [];

  for (const q of questions) {
    const weight = Number(q.weight || 1);
    totalWeight += weight;

    let normalized = 0;
    const ans = answers[q.id] || {};
    let explanation = null;

    switch (q.type) {
      case 'boolean':
        normalized = ans.answer_boolean ? 1 : 0;
        if (q.mandatory && !ans.answer_boolean) missingMandatory.push(q.id);
        break;

      case 'scale':
        normalized = normalizeScaleAnswer(ans.answer_scale || 1);
        if (q.mandatory && (ans.answer_scale == null)) missingMandatory.push(q.id);
        break;

      case 'keyword_presence': {
        const expected = q.expected_keywords || [];
        normalized = computeKeywordScore(expected, transcript, ans.provided_matches || []);
        if (q.mandatory && normalized === 0) missingMandatory.push(q.id);
        break;
      }

      case 'text':
        normalized = ans.answer_text ? 1 : 0;
        if (q.mandatory && !ans.answer_text) missingMandatory.push(q.id);
        break;

      case 'multiple_choice': {
        // Simple: score = (number selected) / (number of options for that question) capped at 1.
        // Caller must supply question.option_count in questions if needed.
        const selected = Array.isArray(ans.selected_option_ids) ? ans.selected_option_ids.length : 0;
        const optionCount = q.option_count || 1;
        normalized = optionCount > 0 ? Math.min(1, selected / optionCount) : 0;
        if (q.mandatory && selected === 0) missingMandatory.push(q.id);
        break;
      }

      default:
        normalized = 0;
        if (q.mandatory) missingMandatory.push(q.id);
    }

    accumulated += normalized * weight;
    perQuestion.push({
      question_id: q.id,
      normalized_score: Number(normalized.toFixed(3)),
      answer: ans,
    });
  }

  const overallScore = totalWeight ? (accumulated / totalWeight) * 100 : 0;
  const passed = missingMandatory.length === 0;

  return {
    overallScore: Number(overallScore.toFixed(2)),
    passed,
    missingMandatory,
    perQuestion,
  };
}

module.exports = { scoreEvaluation };
