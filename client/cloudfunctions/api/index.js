const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

// 导入模型
require('./src/models/User');
require('./src/models/Resume');
require('./src/models/InterviewRecord');
require('./src/models/ApplicationTracker');
require('./src/models/SkillDimension');
require('./src/models/JobCollection');
require('./src/models/QuestionBank');

const sequelize = require('./src/config/db');

// 路由
const userRoutes = require('./src/routes/user');
const resumeRoutes = require('./src/routes/resume');
const interviewRoutes = require('./src/routes/interview');
const applicationRoutes = require('./src/routes/application');
const questionsRoutes = require('./src/routes/questions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/questions', questionsRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 启动
let ready = false;
const initPromise = (async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  ready = true;
  console.log('[CF] 数据库连接成功');
})();

// 云函数入口
exports.main = async (event, context) => {
  if (!ready) await initPromise;
  const handler = serverless(app);
  return handler(event, context);
};
