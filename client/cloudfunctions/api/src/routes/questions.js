const { Router } = require('express');
const { Sequelize } = require('sequelize');
const QuestionBank = require('../models/QuestionBank');
const router = Router();

// 获取题库分类与列表
router.get('/list', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    const questions = await QuestionBank.findAll({
      where,
      order: [['category', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'category', 'title', 'content', 'difficulty']
    });
    res.json({ code: 0, data: questions });
  } catch (err) {
    console.error('[Questions/list]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 获取每日面经推荐 — 以当天日期为种子随机取3条
router.get('/daily-recommend', async (req, res) => {
  try {
    const questions = await QuestionBank.findAll({
      order: Sequelize.literal('RAND(TO_DAYS(CURDATE()))'),
      limit: 3,
      attributes: ['id', 'category', 'title', 'content']
    });
    res.json({ code: 0, data: questions });
  } catch (err) {
    console.error('[Questions/daily]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 获取单题详情
router.get('/detail/:id', async (req, res) => {
  try {
    const q = await QuestionBank.findByPk(req.params.id);
    if (!q) return res.status(404).json({ error: '题目不存在' });
    res.json({ code: 0, data: q.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
