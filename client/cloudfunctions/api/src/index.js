const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');

// 导入模型（确保注册顺序）
require('./models/User');
require('./models/Resume');
require('./models/InterviewRecord');
require('./models/ApplicationTracker');
require('./models/SkillDimension');
require('./models/JobCollection');
require('./models/QuestionBank');

// 导入路由
const userRoutes = require('./routes/user');
const resumeRoutes = require('./routes/resume');
const interviewRoutes = require('./routes/interview');
const applicationRoutes = require('./routes/application');
const questionsRoutes = require('./routes/questions');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 中间件 ────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});

// ── 路由注册 ─────────────────────────────────
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/questions', questionsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── 启动 ─────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('[DB] MySQL 连接成功');

    // 自动建表：alter 会检测新模型/新字段但保留已有数据
    await sequelize.sync();
    console.log('[DB] 表结构同步完成');

    // 检查是否为首次启动 → 写入种子数据
    await seedIfEmpty();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] OfferGo 服务运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[FATAL] 启动失败:', err.message);
    process.exit(1);
  }
}

/**
 * 首次启动时自动写入测试数据
 */
async function seedIfEmpty() {
  const User = require('./models/User');
  const Resume = require('./models/Resume');
  const ApplicationTracker = require('./models/ApplicationTracker');
  const InterviewRecord = require('./models/InterviewRecord');
  const SkillDimension = require('./models/SkillDimension');
  const JobCollection = require('./models/JobCollection');
  const QuestionBank = require('./models/QuestionBank');

  const userCount = await User.count();
  const needsFullSeed = userCount === 0;

  let userId = 1; // 默认用现有首个用户或新用户
  const existingUser = await User.findOne();

  if (needsFullSeed || !existingUser) {
    console.log('[Seed] 写入基础数据...');

    // 1. 创建测试用户
    const crypto = require('crypto');
    const user = await User.create({
      username: 'test',
      password: crypto.createHash('sha256').update('123456').digest('hex'),
      openid: 'test_openid_001',
      nickname: '张三',
      targetPosition: '前端开发工程师',
      targetCity: '北京',
      expectedSalary: '15k-25k',
      techStack: ['JavaScript', 'Vue 3', 'React', 'Node.js', 'TypeScript']
    });
    userId = user.id;
    console.log('[Seed] 用户创建:', userId);

    // 2. 简历
    await Resume.create({
      userId,
      education: [{ school: '北京大学', major: '计算机科学与技术', degree: '本科', period: '2021-2025' }],
      skills: ['JavaScript', 'Vue 3', 'React', 'Node.js', 'TypeScript', 'Git', 'Webpack'],
      projects: [
        { name: '电商后台管理系统', role: '前端负责人', techStackStr: 'Vue3,ElementPlus,Axios', description: '独立完成从0到1的后台系统搭建', result: '日均处理订单500+' },
        { name: '实时聊天应用', role: '全栈开发', techStackStr: 'React,Node.js,Socket.io', description: '基于WebSocket的实时通讯系统', result: '千人同时在线,延迟<100ms' }
      ],
      rawText: ''
    });
    console.log('[Seed] 简历创建');

    // 3. 投递记录
    const apps = [
      { companyName: '字节跳动', position: '前端开发工程师', stage: 'submitted', appliedAt: new Date('2025-08-15') },
      { companyName: '腾讯', position: '前端开发工程师', stage: 'written_test', appliedAt: new Date('2025-08-12') },
      { companyName: '阿里巴巴', position: '前端开发工程师', stage: 'interview_1', appliedAt: new Date('2025-08-10') },
      { companyName: '美团', position: '前端开发工程师', stage: 'interview_2', appliedAt: new Date('2025-08-05') },
      { companyName: '小红书', position: '前端开发工程师', stage: 'hr_interview', appliedAt: new Date('2025-07-28') },
      { companyName: '百度', position: '前端开发工程师', stage: 'offer_pool', appliedAt: new Date('2025-07-20') },
      { companyName: '京东', position: '前端开发工程师', stage: 'rejected', appliedAt: new Date('2025-07-15') },
      { companyName: '网易', position: '前端开发工程师', stage: 'submitted', appliedAt: new Date('2025-08-13') }
    ];
    const stages = ['submitted', 'written_test', 'interview_1', 'interview_2', 'hr_interview', 'offer_pool', 'rejected'];
    for (const a of apps) {
      await ApplicationTracker.create({ userId, ...a, stageOrder: stages.indexOf(a.stage) });
    }
    console.log(`[Seed] ${apps.length} 条投递`);

    // 4. 面试记录
    await InterviewRecord.create({
      userId, sessionId: 'seed_session_001', interviewType: 'tech', targetPosition: '前端开发工程师',
      status: 'completed', score: 78,
      evaluation: '整体表现良好，技术基础扎实。Vue3原理理解到位，算法复杂度需加强。',
      suggestions: '建议深入研究 Vue3 源码和虚拟 DOM diff 算法。',
      messages: [
        { role: 'assistant', content: '你好，请先做个自我介绍。' },
        { role: 'user', content: '我是张三，北大计算机应届生，精通Vue3和React...' },
        { role: 'assistant', content: '能说说Composition API相比Options API的优势吗？' },
        { role: 'user', content: 'Composition API可以更好的逻辑复用...' }
      ]
    });
    console.log('[Seed] 面试记录写入');

    // 5. 能力维度
    await SkillDimension.create({ userId, techDepth: 82, communication: 75, projectExp: 78, logicThinking: 70, industryKnowledge: 65 });
    console.log('[Seed] 能力维度写入');

    // 6. 职位库
    const jobs = [
      { title: '前端开发工程师', company: '字节跳动', category: '前端', keywords: ['JS', 'TS', 'React', 'Vue', 'Webpack'], jdText: '负责核心产品前端开发。要求精通HTML/CSS/JS，熟悉React或Vue框架，有性能优化经验。' },
      { title: '后端开发工程师', company: '阿里巴巴', category: '后端', keywords: ['Java', 'SpringBoot', 'MySQL', 'Redis', '微服务'], jdText: '参与电商平台后端开发。要求扎实的Java基础，熟悉SpringBoot/MyBatis，掌握MySQL优化。' },
      { title: '算法工程师', company: '腾讯', category: '算法', keywords: ['Python', 'ML', 'DL', 'NLP', 'CV', 'PyTorch'], jdText: '负责AI算法模型研发与落地。熟练使用Python，掌握机器学习和深度学习框架。' },
      { title: '产品经理', company: '美团', category: '产品', keywords: ['需求分析', '原型设计', '数据分析', 'PRD'], jdText: '负责本地生活业务产品规划。逻辑清晰，数据驱动，能独立完成PRD和原型设计。' }
    ];
    for (const j of jobs) await JobCollection.create(j);
    console.log(`[Seed] ${jobs.length} 条职位库`);

  } else {
    userId = existingUser.id;
    // 补充缺失的登录凭据
    const crypto = require('crypto');
    if (!existingUser.username || !existingUser.password) {
      existingUser.username = 'test';
      existingUser.password = crypto.createHash('sha256').update('123456').digest('hex');
      await existingUser.save();
      console.log('[Seed] 已更新用户登录凭据 (test/123456)');
    }
  }

  // 7. 题库 — 独立补写，不受用户是否已存在影响
  const qCount = await QuestionBank.count();
  if (qCount === 0) {
    console.log('[Seed] 题库为空，写入20条...');
    const questions = [
      { category: '前端进阶', title: 'Vue 3 响应式原理：ref 和 reactive 的区别？', content: 'ref 用于基本类型，内部通过 getter/setter 拦截；reactive 用于对象类型，通过 Proxy 代理。ref 的 .value 是必须的，reactive 则直接访问。', difficulty: 'medium' },
      { category: '前端进阶', title: 'JavaScript 闭包的原理与应用场景', content: '闭包是指函数能访问其外部作用域的变量。原理：函数执行时创建执行上下文，内部函数保留对外部变量对象的引用。应用：模块化、柯里化、防抖节流、数据私有化。', difficulty: 'medium' },
      { category: '前端进阶', title: '虚拟 DOM 的 diff 算法核心思想', content: '同层比较：只比较同层级节点。双端比较：新旧 VNode 各设两个指针向中间移动。key 的作用：唯一标识节点，避免就地复用。时间复杂度从 O(n³) 优化到 O(n)。', difficulty: 'hard' },
      { category: '前端进阶', title: '浏览器渲染流程：输入 URL 到页面展示', content: '1.DNS解析→2.TCP握手→3.HTTP请求→4.服务器响应→5.DOM树→6.CSSOM→7.渲染树→8.布局→9.绘制→10.合成', difficulty: 'medium' },
      { category: '前端进阶', title: 'Webpack 和 Vite 的构建原理对比', content: 'Webpack 基于打包思想，开发时需全量构建。Vite 基于 ESM 按需编译，开发服务器冷启动极快，HMR 毫秒级。生产环境 Vite 用 Rollup 打包。', difficulty: 'medium' },
      { category: '后端基础', title: 'Java 中 HashMap 的底层实现原理', content: 'JDK8 后采用数组+链表+红黑树。通过 key 的 hashCode 计算下标，冲突用链表法。链表长度>8且数组长度>64时转红黑树。扩容因子默认0.75。', difficulty: 'medium' },
      { category: '后端基础', title: 'Spring Boot 自动配置原理', content: '@EnableAutoConfiguration 通过 spring.factories 加载所有 AutoConfiguration 类，@Conditional 条件注解判断是否生效。', difficulty: 'medium' },
      { category: '后端基础', title: 'MySQL 索引：B+树比 B 树更适合数据库', content: 'B+树非叶子节点不存数据→节点可容纳更多键→树更矮→IO更少。叶子节点双向链表→支持范围查询。查询效率 O(log n)。', difficulty: 'hard' },
      { category: '后端基础', title: 'Redis 缓存穿透、击穿、雪崩的区别', content: '穿透：查不存在的数据→布隆过滤器。击穿：热点key过期→互斥锁。雪崩：大量key同时过期→过期时间加随机值/多级缓存。', difficulty: 'hard' },
      { category: '后端基础', title: 'synchronized 和 ReentrantLock 的区别', content: 'synchronized 是 JVM 关键字自动加锁；ReentrantLock 是 API 类，支持公平锁、可中断、条件变量、超时等高级特性。', difficulty: 'medium' },
      { category: '计算机基础', title: 'TCP 三次握手与四次挥手过程', content: '握手：1.C→S SYN  2.S→C SYN+ACK  3.C→S ACK。挥手：1.C→S FIN  2.S→C ACK  3.S→C FIN  4.C→S ACK 等待2MSL。', difficulty: 'medium' },
      { category: '计算机基础', title: 'HTTP 和 HTTPS 的区别', content: 'HTTPS=HTTP+SSL/TLS。端口：80 vs 443。HTTPS 加密传输防窃听篡改，需要CA证书。HTTP/2 已优化性能。', difficulty: 'easy' },
      { category: '计算机基础', title: '进程和线程的区别', content: '进程是资源分配最小单位，独立内存；线程是CPU调度最小单位，共享内存。进程切换开销大，线程切换开销小。', difficulty: 'easy' },
      { category: '计算机基础', title: 'DNS 解析的完整过程', content: '浏览器缓存→hosts→本地DNS→根域名服务器→顶级域名→权威域名→返回IP。递归查询：本地代劳；迭代查询：逐级指引。', difficulty: 'medium' },
      { category: '计算机基础', title: '死锁的四个必要条件及解决方案', content: '互斥、持有并等待、不可剥夺、循环等待。破坏其一即可。方案：资源有序分配法、超时、检测恢复。银行家算法可预防。', difficulty: 'hard' },
      { category: 'HR综合', title: '请做一下自我介绍', content: '姓名+学校+专业→技术栈和核心能力→最亮眼项目经历→为什么应聘。控制60-90秒，突出岗位匹配度。', difficulty: 'easy' },
      { category: 'HR综合', title: '你的职业规划是什么？', content: '短期(1-2年)深入技术成为骨干→中期(3-5年)形成专长具备架构能力→长期成为技术leader或领域专家。体现成长性和务实性。', difficulty: 'medium' },
      { category: 'HR综合', title: '你最大的缺点是什么？', content: '选真实的、非致命的、已在改进的缺点。核心：展示自我认知+改进意愿+实际行动。如公开表达→主动锻炼→已能正常汇报。', difficulty: 'medium' },
      { category: 'HR综合', title: '为什么选择我们公司？', content: '从业务(看好赛道)、技术(认可挑战)、文化(认同价值观)三维度回答。提前做功课，说具体不泛泛。', difficulty: 'medium' },
      { category: 'HR综合', title: '你对加班的看法？', content: '理解冲刺期加班→但强调提升效率避免常态加班→愿意为团队付出，同时认为平衡能提升长期产出。', difficulty: 'easy' }
    ];
    for (const q of questions) await QuestionBank.create(q);
    console.log(`[Seed] ${questions.length} 条题库写入`);
  } else {
    console.log(`[Seed] 题库已有 ${qCount} 条，跳过`);
  }

  console.log('[Seed] ✅ 完成');
}

start();
