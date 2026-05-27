const { Router } = require('express');
const ApplicationTracker = require('../models/ApplicationTracker');
const router = Router();

// 创建投递记录
router.post('/', async (req, res) => {
  try {
    const { userId, companyName, position, stage, interviewTime, remark } = req.body;
    if (!userId || !companyName) {
      return res.status(400).json({ error: '缺少 userId 或 companyName' });
    }

    const record = await ApplicationTracker.create({
      userId,
      companyName,
      position: position || '',
      stage: stage || 'submitted',
      stageOrder: stageOrderMap[stage || 'submitted'] || 0,
      interviewTime: interviewTime || null,
      remark: remark || ''
    });

    res.json({ code: 0, data: record.toJSON() });
  } catch (err) {
    console.error('[Application/create]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 获取用户的所有投递（按看板状态分组）
router.get('/kanban/:userId', async (req, res) => {
  try {
    const records = await ApplicationTracker.findAll({
      where: { userId: req.params.userId },
      order: [['stageOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    // 按阶段分组
    const kanban = {
      submitted: [],
      written_test: [],
      interview_1: [],
      interview_2: [],
      hr_interview: [],
      offer_pool: [],
      rejected: []
    };

    records.forEach(r => {
      const stage = r.stage;
      if (kanban[stage]) {
        kanban[stage].push(r.toJSON());
      }
    });

    res.json({ code: 0, data: kanban });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新投递状态（拖拽后调用）
router.put('/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: '缺少 stage' });

    const record = await ApplicationTracker.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });

    record.stage = stage;
    record.stageOrder = stageOrderMap[stage] || 0;
    await record.save();

    res.json({ code: 0, data: record.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新面试时间
router.put('/:id/interview-time', async (req, res) => {
  try {
    const { interviewTime } = req.body;
    const record = await ApplicationTracker.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });

    record.interviewTime = interviewTime || null;
    await record.save();

    res.json({ code: 0, data: record.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新备注
router.put('/:id/remark', async (req, res) => {
  try {
    const { remark } = req.body;
    const record = await ApplicationTracker.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });

    record.remark = remark || '';
    await record.save();

    res.json({ code: 0, data: record.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除投递记录
router.delete('/:id', async (req, res) => {
  try {
    const record = await ApplicationTracker.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });

    await record.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取统计数据
router.get('/stats/:userId', async (req, res) => {
  try {
    const records = await ApplicationTracker.findAll({
      where: { userId: req.params.userId }
    });

    const stats = {
      total: records.length,
      submitted: 0,
      interviews: 0,    // 所有面试阶段的合计
      offers: 0,
      rejected: 0
    };

    records.forEach(r => {
      if (r.stage === 'submitted') stats.submitted++;
      else if (['written_test', 'interview_1', 'interview_2', 'hr_interview'].includes(r.stage)) stats.interviews++;
      else if (r.stage === 'offer_pool') stats.offers++;
      else if (r.stage === 'rejected') stats.rejected++;
    });

    res.json({ code: 0, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 阶段排序权重
const stageOrderMap = {
  submitted: 0,
  written_test: 1,
  interview_1: 2,
  interview_2: 3,
  hr_interview: 4,
  offer_pool: 5,
  rejected: 6
};

module.exports = router;
