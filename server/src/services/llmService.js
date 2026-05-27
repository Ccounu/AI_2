/**
 * 通用 LLM 服务
 * 兼容 OpenAI 格式的 API（智谱 GLM-4 / 月之暗面 Kimi / 通义千问 等）
 */
require('dotenv').config();

const API_KEY = process.env.LLM_API_KEY || '';
const BASE_URL = process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const MODEL = process.env.LLM_MODEL || 'glm-4-flash';

/**
 * 非流式调用 — 用于简历分析等一次性请求
 * @param {Array} messages - [{role, content}]
 * @param {Object} options - { temperature, max_tokens }
 * @returns {Promise<string>} AI 回复内容
 */
async function chatCompletion(messages, options = {}) {
  const url = `${BASE_URL}/chat/completions`;
  const body = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
    stream: false
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[LLM] API调用失败 状态码:', res.status, '响应:', errText.slice(0, 300));
    throw new Error(`LLM API 错误 (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 流式调用 — 用于模拟面试逐字输出
 * @param {Array} messages - [{role, content}]
 * @param {Object} options - { temperature, max_tokens }
 * @returns {Promise<Response>} fetch Response 对象（body 是 ReadableStream）
 */
async function chatCompletionStream(messages, options = {}) {
  const url = `${BASE_URL}/chat/completions`;
  const body = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4096,
    stream: true
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM 流式 API 错误 (${res.status}): ${errText}`);
  }

  return res;
}

/**
 * 解析 SSE 数据块，提取 content 片段
 * @param {Buffer|string} chunk
 * @returns {string} 提取到的文本内容（可能为空）
 */
function parseSSEChunk(chunk) {
  const text = typeof chunk === 'string' ? chunk : chunk.toString();
  const lines = text.split('\n');
  let content = '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      } catch { /* skip malformed */ }
    }
  }

  return content;
}

module.exports = {
  chatCompletion,
  chatCompletionStream,
  parseSSEChunk
};
