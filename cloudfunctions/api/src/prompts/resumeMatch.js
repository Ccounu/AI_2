/**
 * 简历-JD 匹配分析 Prompt
 * 输入：用户简历文本 + 目标岗位 JD
 * 输出：JSON 格式的匹配分数、缺失关键词、STAR 润色建议
 */

function buildResumeMatchPrompt(resumeText, jdText) {
  return [
    {
      role: 'system',
      content: `你是一位资深 HR 和职业规划顾问，擅长分析简历与岗位的匹配度。
请严格按照 JSON 格式输出分析结果，不要输出其他内容。

输出格式：
{
  "matchScore": <0-100的整数>,
  "matchedKeywords": ["关键词1", "关键词2", ...],
  "missingKeywords": ["缺失关键词1", ...],
  "strengths": ["简历优势描述1", ...],
  "suggestions": {
    "keywordAdvice": "建议补充哪些关键词/技能",
    "starAdvice": "如何用 STAR 法则优化项目经历的具体建议"
  }
}`
    },
    {
      role: 'user',
      content: `【我的简历】
${resumeText}

【目标岗位 JD】
${jdText}

请分析我的简历与这个岗位的匹配度，给出分数、匹配/缺失关键词、优势和改进建议。`
    }
  ];
}

module.exports = { buildResumeMatchPrompt };
