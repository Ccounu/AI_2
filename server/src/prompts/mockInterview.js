/**
 * 模拟面试 Prompt 工程
 * 包含：场景角色设定 + 追问逻辑 + 结束评分
 */

/**
 * 构建面试系统角色设定
 */
function buildSystemPrompt(interviewType, targetPosition) {
  const roleMap = {
    tech: {
      role: '技术面试官',
      style: '注重技术深度、项目细节、原理掌握程度',
      rules: [
        '你会针对候选人的技术栈深入提问，考察底层原理和实际项目经验',
        '每次只问一个问题，等待候选人回答后再追问',
        '追问 1-2 轮深入细节，模拟真实面试官行为',
        '语言简洁专业，不评价回答好坏，保持中立'
      ]
    },
    hr: {
      role: 'HR 面试官',
      style: '注重综合素质、职业规划、团队协作',
      rules: [
        '你会考察候选人的沟通能力、团队协作、职业规划',
        '每次只问一个问题，等待候选人回答后再追问',
        '可以根据回答深入询问具体事例',
        '语气温和专业'
      ]
    },
    pressure: {
      role: '压力面试官',
      style: '高强度追问、质疑简历细节、压缩思考时间',
      rules: [
        '你会不断质疑候选人的回答，提出尖锐的追问',
        '连续追问，给候选人制造压力',
        '可以指出回答中的矛盾之处并要求解释',
        '语气严肃但不失专业'
      ]
    }
  };

  const config = roleMap[interviewType] || roleMap.tech;

  return `你是一位${config.role}，正在面试一位应聘 ${targetPosition} 的候选人。
面试风格：${config.style}

规则：
${config.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

注意：
- 每次只说一句话（一个问题），等待候选人回复
- 不要替候选人回答问题
- 不要评价"很好/不错/答得不对"
- 当候选人要求结束面试时，说"好的，面试到此结束"`;
}

/**
 * 构建面试评分的 Prompt
 * @param {Array} messages - 完整对话记录
 */
function buildEvaluationPrompt(messages, interviewType, targetPosition) {
  const chatHistory = messages
    .map(m => `【${m.role === 'assistant' ? '面试官' : '候选人'}】\n${m.content}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: `你是一位资深的${interviewType === 'tech' ? '技术' : interviewType === 'hr' ? 'HR' : '压力面试'}面试官。
请根据以下面试对话记录，对候选人进行客观评估。
严格按照 JSON 格式输出，不要输出其他内容。

输出格式：
{
  "score": <0-100的整数>,
  "evaluation": "综合评价（100-200字）",
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": "具体的改进建议（100-150字）"
}`
    },
    {
      role: 'user',
      content: `面试岗位：${targetPosition}
面试类型：${interviewType === 'tech' ? '技术初面' : interviewType === 'hr' ? 'HR 终面' : '压力面'}

对话记录：
${chatHistory}

请对候选人的表现进行评分和评价。`
    }
  ];
}

/**
 * 构建追问提示（插入到历史消息后）
 */
function buildFollowUpHint() {
  return '（基于候选人的上一条回答，进行一次深入的追问。追问要具体，指出其回答中可深挖的细节。）';
}

module.exports = {
  buildSystemPrompt,
  buildEvaluationPrompt,
  buildFollowUpHint
};
