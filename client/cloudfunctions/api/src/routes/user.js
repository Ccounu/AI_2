const { Router } = require('express');
const User = require('../models/User');
const SkillDimension = require('../models/SkillDimension');
const InterviewRecord = require('../models/InterviewRecord');
const Resume = require('../models/Resume');
const router = Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 1, error: '用户名和密码不能为空' });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ code: 1, error: '用户名已存在' });
    }
    // 前端已 SHA256 哈希，直接存储
    const user = await User.create({
      username,
      password,
      nickname: nickname || username
    });
    res.json({ code: 0, data: { id: user.id, username: user.username, nickname: user.nickname } });
  } catch (err) {
    console.error('[User/register]', err.message);
    res.status(500).json({ code: 1, error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, openid, nickname } = req.body;

    // 用户名密码登录（前端已 SHA256 哈希）
    if (username && password) {
      const user = await User.findOne({ where: { username } });
      if (!user) return res.status(401).json({ code: 1, error: '用户名或密码错误' });
      if (user.password !== password) {
        return res.status(401).json({ code: 1, error: '用户名或密码错误' });
      }
      return res.json({ code: 0, data: user.toJSON() });
    }

    // 微信登录（兼容）
    if (openid) {
      const [user, created] = await User.findOrCreate({
        where: { openid },
        defaults: { nickname: nickname || '求职者', avatar: '' }
      });
      if (!created && nickname) {
        user.nickname = nickname;
        await user.save();
      }
      return res.json({ code: 0, data: user.toJSON() });
    }

    return res.status(400).json({ code: 1, error: '请提供用户名密码或openid' });
  } catch (err) {
    console.error('[User/login]', err.message);
    res.status(500).json({ code: 1, error: err.message });
  }
});

// 微信登录 / 注册（兼容旧路由）
router.post('/wx-login', async (req, res) => {
  try {
    const { openid, nickname, avatar } = req.body;
    if (!openid) return res.status(400).json({ error: '缺少 openid' });

    const [user, created] = await User.findOrCreate({
      where: { openid },
      defaults: { nickname: nickname || '求职者', avatar: avatar || '' }
    });

    // 更新昵称/头像（非首次登录也更新）
    if (!created) {
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    res.json({ code: 0, data: user.toJSON() });
  } catch (err) {
    console.error('[User/login]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 获取个人偏好（别名） ─────────────────────
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ code: 1, error: '用户不存在' });
    res.json({ code: 0, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ code: 1, error: err.message });
  }
});

// ─── 更新个人偏好（别名） ─────────────────────
router.post('/profile/update', async (req, res) => {
  try {
    const { userId, targetCity, expectedSalary, targetPosition, techStack, nickname } = req.body;
    if (!userId) return res.status(400).json({ code: 1, error: '缺少 userId' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ code: 1, error: '用户不存在' });

    if (targetCity !== undefined) user.targetCity = targetCity;
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary;
    if (targetPosition !== undefined) user.targetPosition = targetPosition;
    if (techStack !== undefined) user.techStack = techStack;
    if (nickname !== undefined) user.nickname = nickname;

    await user.save();
    res.json({ code: 0, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ code: 1, error: err.message });
  }
});

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ code: 0, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新求职意向
router.put('/:id/preference', async (req, res) => {
  try {
    const { targetCity, expectedSalary, targetPosition, techStack } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    if (targetCity !== undefined) user.targetCity = targetCity;
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary;
    if (targetPosition !== undefined) user.targetPosition = targetPosition;
    if (techStack !== undefined) user.techStack = techStack;

    await user.save();
    res.json({ code: 0, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户能力雷达图数据 — 从 interview_records + resumes 计算
router.get('/:id/radar', async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. 取最新已完成的面试记录
    const latestInterview = await InterviewRecord.findOne({
      where: { userId, status: 'completed' },
      order: [['createdAt', 'DESC']]
    });

    // 2. 取用户简历
    const resume = await Resume.findOne({ where: { userId } });

    // 如果没有任何数据 → 返回空
    if (!latestInterview && !resume) {
      return res.json({ code: 0, data: { hasData: false } });
    }

    const interviewScore = latestInterview ? latestInterview.score : 0;
    const techStack = (resume && resume.skills) ? resume.skills : [];
    const projectCount = (resume && resume.projects) ? resume.projects.length : 0;

    // ── 从面试分和简历数据推导五个维度 ──
    const baseScore = interviewScore > 0 ? interviewScore : 60;

    // 技术深度：面试分 + 技能数量加权
    const techDepth = Math.min(95, Math.round(baseScore * 0.7 + Math.min(techStack.length * 5, 30)));

    // 沟通表达：面试分（面试本身就是沟通场景）
    const communication = Math.min(95, Math.round(baseScore * 0.85 + (Math.random() * 10 - 5)));

    // 项目经验：项目数量 × 15 + 基础分
    const projectExp = Math.min(95, Math.round(50 + projectCount * 15));

    // 逻辑思维：面试分 × 0.9
    const logicThinking = Math.min(95, Math.round(baseScore * 0.9));

    // 行业认知：面试分 × 0.6 + 技能数量加权
    const industryKnowledge = Math.min(95, Math.round(baseScore * 0.6 + Math.min(techStack.length * 4, 20)));

    const labels = ['技术深度', '沟通表达', '项目经验', '逻辑思维', '行业认知'];
    const values = [techDepth, communication, projectExp, logicThinking, industryKnowledge];

    // 写回 skill_dimensions 表（缓存）
    const [sd] = await SkillDimension.findOrCreate({ where: { userId } });
    sd.techDepth = techDepth;
    sd.communication = communication;
    sd.projectExp = projectExp;
    sd.logicThinking = logicThinking;
    sd.industryKnowledge = industryKnowledge;
    await sd.save();

    res.json({ code: 0, data: { hasData: true, labels, values } });
  } catch (err) {
    console.error('[Radar]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
