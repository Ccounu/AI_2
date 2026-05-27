const { Router } = require('express');
const Resume = require('../models/Resume');
const { chatCompletion } = require('../services/llmService');
const { buildResumeMatchPrompt } = require('../prompts/resumeMatch');
const router = Router();

// 保存/更新简历
router.post('/save', async (req, res) => {
  try {
    const { userId, education, projects, skills, rawText } = req.body;
    if (!userId) return res.status(400).json({ error: '缺少 userId' });

    const [resume, created] = await Resume.findOrCreate({
      where: { userId },
      defaults: { userId, education: [], projects: [], skills: [], rawText: '' }
    });

    if (education !== undefined) resume.education = education;
    if (projects !== undefined) resume.projects = projects;
    if (skills !== undefined) resume.skills = skills;
    if (rawText !== undefined) resume.rawText = rawText;

    await resume.save();

    // 构建完整简历文本用于后续匹配
    const fullText = buildResumeText(resume);
    res.json({ code: 0, data: { ...resume.toJSON(), fullText } });
  } catch (err) {
    console.error('[Resume/save]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 获取用户简历
router.get('/:userId', async (req, res) => {
  try {
    const resume = await Resume.findOne({ where: { userId: req.params.userId } });
    if (!resume) return res.json({ code: 0, data: null });
    const fullText = buildResumeText(resume);
    res.json({ code: 0, data: { ...resume.toJSON(), fullText } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JD 匹配分析（调用 LLM）
router.post('/analyze', async (req, res) => {
  try {
    const { userId, jdText } = req.body;
    if (!jdText) return res.status(400).json({ error: '缺少 JD 文本' });

    // 获取简历
    const resume = await Resume.findOne({ where: { userId } });
    const resumeText = resume ? buildResumeText(resume) : '（用户尚未完善简历）';

    // 调用 LLM
    const prompt = buildResumeMatchPrompt(resumeText, jdText);
    const aiResponse = await chatCompletion(prompt, { temperature: 0.3, max_tokens: 2048 });

    // 解析 JSON
    let result;
    try {
      // 兼容 markdown 代码块包裹
      const clean = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = {
        matchScore: 0,
        matchedKeywords: [],
        missingKeywords: [],
        strengths: [],
        suggestions: { keywordAdvice: '解析失败，请重试', starAdvice: '' }
      };
    }

    // 缓存匹配结果
    if (resume) {
      resume.lastMatchScore = result.matchScore || 0;
      resume.lastJdText = jdText;
      await resume.save();
    }

    res.json({ code: 0, data: result, resumeText });
  } catch (err) {
    console.error('[Resume/analyze]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 将结构化简历拼成纯文本
 */
function buildResumeText(resume) {
  const parts = [];

  // 教育背景
  const edu = resume.education || [];
  if (edu.length > 0) {
    parts.push('【教育背景】');
    edu.forEach(e => {
      parts.push(`- ${e.school || ''} | ${e.major || ''} | ${e.degree || ''} | ${e.period || ''}`);
    });
  }

  // 专业技能
  const skills = resume.skills || [];
  if (skills.length > 0) {
    parts.push('【专业技能】');
    parts.push(skills.join('、'));
  }

  // 项目经历
  const projects = resume.projects || [];
  if (projects.length > 0) {
    parts.push('【项目经历】');
    projects.forEach(p => {
      parts.push(`- 项目：${p.name || ''}`);
      parts.push(`  角色：${p.role || ''}`);
      parts.push(`  技术栈：${(p.techStack || []).join(', ')}`);
      parts.push(`  描述：${p.description || ''}`);
      parts.push(`  成果：${p.result || ''}`);
    });
  }

  // 原始粘贴文本（兜底）
  if (resume.rawText) {
    parts.push('【原始简历】');
    parts.push(resume.rawText);
  }

  return parts.join('\n') || '（简历信息为空）';
}

module.exports = router;
