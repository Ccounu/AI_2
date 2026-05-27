const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const InterviewRecord = require('../models/InterviewRecord');
const { chatCompletion, chatCompletionStream, parseSSEChunk } = require('../services/llmService');
const { buildSystemPrompt, buildEvaluationPrompt } = require('../prompts/mockInterview');
const router = Router();

// 启动面试会话
router.post('/start', async (req, res) => {
  try {
    const { userId, interviewType, targetPosition } = req.body;
    if (!userId) return res.status(400).json({ error: '缺少 userId' });
    if (!targetPosition) return res.status(400).json({ error: '请填写应聘岗位' });

    const sessionId = uuidv4();
    const systemPrompt = buildSystemPrompt(interviewType || 'tech', targetPosition);

    // AI 生成开场白（LLM 不可用时用默认开场白兜底）
    let greeting;
    try {
      greeting = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请开始面试，先做一个简单的自我介绍并开始提问。' }
      ], { temperature: 0.8, max_tokens: 256 });
    } catch (llmErr) {
      console.error('[Interview/start] LLM失败，使用默认开场白:', llmErr.message.slice(0, 150));
      const defaults = {
        tech: `你好！欢迎参加${targetPosition}的技术面试。请先做个简单的自我介绍，重点说说你的技术栈和项目经历。`,
        hr: `你好！我是今天的HR面试官。请先简单介绍一下你自己，包括你的教育背景和职业规划。`,
        pressure: `你好，请坐。给你30秒，用最精炼的话告诉我，为什么我们应该录用你？`
      };
      greeting = defaults[interviewType] || defaults.tech;
    }

    const initialMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: greeting }
    ];

    const record = await InterviewRecord.create({
      userId,
      sessionId,
      interviewType: interviewType || 'tech',
      targetPosition,
      messages: initialMessages,
      status: 'in_progress'
    });

    res.json({
      code: 0,
      data: {
        sessionId: record.sessionId,
        greeting,
        interviewType: record.interviewType,
        targetPosition: record.targetPosition
      }
    });
  } catch (err) {
    console.error('[Interview/start]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 非流式对话（POST — 适配微信小程序，不支持 EventSource）
router.post('/chat', async (req, res) => {
  try {
    // 兼容两种传参方式：JSON body 或 form-urlencoded
    const sessionId = req.body.sessionId || req.query.sessionId;
    const message = req.body.message || req.query.message;
    console.log('[Interview/chat] sessionId:', sessionId, 'message长度:', (message||'').length);
    if (!sessionId || !message) {
      return res.status(400).json({ error: '缺少 sessionId 或 message' });
    }

    const record = await InterviewRecord.findOne({ where: { sessionId } });
    if (!record) return res.status(404).json({ error: '面试会话不存在' });

    const messages = record.messages;
    messages.push({ role: 'user', content: message });

    // 构建请求消息（系统提示在最前）
    const systemMsg = messages.find(m => m.role === 'system');
    const apiMessages = messages.filter(m => m.role !== 'system');
    const requestMessages = systemMsg ? [systemMsg, ...apiMessages] : apiMessages;

    // 非流式调用 LLM（失败时返回友好提示）
    let reply;
    try {
      reply = await chatCompletion(requestMessages, { temperature: 0.8, max_tokens: 1024 });
    } catch (llmErr) {
      console.error('[Interview/chat/post] LLM失败:', llmErr.message.slice(0, 150));
      reply = '抱歉，AI 服务暂时不可用。请稍后重试。';
    }

    // 存入数据库
    messages.push({ role: 'assistant', content: reply });
    record.messages = messages;
    await record.save();

    res.json({ code: 0, data: { content: reply } });
  } catch (err) {
    console.error('[Interview/chat/post]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 小程序非流式对话（GET — 参数走 URL query，绕过小程序 POST body 序列化问题）
router.get('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.query;
    console.log('[Interview/chat] sessionId:', sessionId, 'message长度:', (message||'').length);
    if (!sessionId || !message) {
      return res.status(400).json({ error: '缺少 sessionId 或 message' });
    }

    const record = await InterviewRecord.findOne({ where: { sessionId } });
    if (!record) return res.status(404).json({ error: '面试会话不存在' });

    const messages = record.messages;
    messages.push({ role: 'user', content: message });

    const systemMsg = messages.find(m => m.role === 'system');
    const apiMessages = messages.filter(m => m.role !== 'system');
    const requestMessages = systemMsg ? [systemMsg, ...apiMessages] : apiMessages;

    // 非流式调用 LLM（失败时返回友好提示）
    let reply;
    try {
      reply = await chatCompletion(requestMessages, { temperature: 0.8, max_tokens: 1024 });
    } catch (llmErr) {
      console.error('[Interview/chat] LLM失败:', llmErr.message.slice(0, 150));
      reply = '抱歉，AI 服务暂时不可用。请稍后重试，或联系管理员检查 API Key 配置。';
    }

    messages.push({ role: 'assistant', content: reply });
    record.messages = messages;
    await record.save();

    res.json({ code: 0, data: { content: reply } });
  } catch (err) {
    console.error('[Interview/chat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 流式对话（SSE — H5 浏览器使用）
router.get('/chat/sse', async (req, res) => {
  try {
    const { sessionId, message } = req.query;
    if (!sessionId || !message) {
      return res.status(400).json({ error: '缺少参数' });
    }

    const record = await InterviewRecord.findOne({ where: { sessionId } });
    if (!record) return res.status(404).json({ error: '面试会话不存在' });

    const messages = record.messages;

    // 追加用户消息
    messages.push({ role: 'user', content: message });

    // 构建 API 请求消息（剔除系统提示中的冗余）
    const apiMessages = messages.filter(m => m.role !== 'system');
    const systemMsg = messages.find(m => m.role === 'system');

    const requestMessages = systemMsg
      ? [systemMsg, ...apiMessages]
      : apiMessages;

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 调用流式 API
    const streamRes = await chatCompletionStream(requestMessages, {
      temperature: 0.8,
      max_tokens: 1024
    });

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    // 逐块读取并推送给客户端
    function push() {
      reader.read().then(({ done, value }) => {
        if (done) {
          // 将 AI 完整回复存入数据库
          messages.push({ role: 'assistant', content: fullContent });
          record.messages = messages;
          record.save().catch(err => console.error('[Interview] save error:', err.message));

          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const text = parseSSEChunk(chunk);
        if (text) {
          fullContent += text;
          // SSE 格式
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }

        push();
      }).catch(err => {
        console.error('[Interview/stream]', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });
    }

    push();

    // 客户端断开清理
    req.on('close', () => {
      reader.cancel().catch(() => {});
    });

  } catch (err) {
    console.error('[Interview/chat]', err.message);
    // 如果还没发送 headers
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// 结束面试 & 获取评分
router.post('/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: '缺少 sessionId' });

    const record = await InterviewRecord.findOne({ where: { sessionId } });
    if (!record) return res.status(404).json({ error: '面试会话不存在' });

    if (record.status === 'completed') {
      return res.json({ code: 0, data: record.toJSON() });
    }

    const systemMsg = record.messages.find(m => m.role === 'system');
    const chatMessages = record.messages.filter(m => m.role !== 'system');

    // 调用 AI 生成评价
    const evalPrompt = buildEvaluationPrompt(
      chatMessages,
      record.interviewType,
      record.targetPosition
    );
    const evalResponse = await chatCompletion(evalPrompt, {
      temperature: 0.3,
      max_tokens: 2048
    });

    // 解析 JSON
    let evaluation;
    try {
      const clean = evalResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(clean);
    } catch {
      evaluation = {
        score: 0,
        evaluation: '评价生成失败',
        strengths: [],
        weaknesses: [],
        suggestions: '请重试'
      };
    }

    // 更新记录
    record.status = 'completed';
    record.score = evaluation.score || 0;
    record.evaluation = evaluation.evaluation || '';
    record.suggestions = evaluation.suggestions || '';
    await record.save();

    res.json({
      code: 0,
      data: {
        score: record.score,
        evaluation: record.evaluation,
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        suggestions: record.suggestions,
        messageCount: chatMessages.length
      }
    });
  } catch (err) {
    console.error('[Interview/end]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 获取面试历史列表
router.get('/history/:userId', async (req, res) => {
  try {
    const records = await InterviewRecord.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'sessionId', 'interviewType', 'targetPosition', 'status', 'score', 'createdAt']
    });
    res.json({ code: 0, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单次面试详情
router.get('/detail/:sessionId', async (req, res) => {
  try {
    const record = await InterviewRecord.findOne({
      where: { sessionId: req.params.sessionId }
    });
    if (!record) return res.status(404).json({ error: '记录不存在' });
    res.json({ code: 0, data: record.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
