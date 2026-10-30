const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 极其丰富的随机词库
const RANDOM_KEYWORDS = [
  // 小说与文学
  '小说', '文学', '长篇小说', '短篇小说', '推理', '悬疑', '科幻', '奇幻', '武侠', '言情', 
  '历史小说', '经典名著', '外国文学', '中国文学', '散文', '随笔', '诗歌', '治愈', '青春',
  // 历史与社科
  '历史', '中国历史', '世界历史', '传记', '人物传记', '社会学', '人类学', '政治', '哲学', '心理学',
  // 商业与科技
  '经济', '商业', '管理学', '投资', '理财', '营销', '互联网', '科技', '人工智能', '编程',
  // 生活与艺术
  '生活', '美食', '旅行', '健康', '养生', '艺术', '设计', '摄影', '音乐', '电影'
];

app.post('/api/weread', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const mode = req.body.mode || 'tag'; 
    const keyword = req.body.keyword || '小说'; 
    const count = req.body.count || 1; 

    let finalKeyword = keyword;
    let requestCount = count;

    // 如果是随机模式
    if (mode === 'random') {
      // 从丰富的词库中随机抽取一个词
      finalKeyword = RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)];
      
      // 多要一点（10本），方便后端打乱后抽出最不重复的
      requestCount =10; 
    }

    const wereadPayload = {
      "api_name": "/store/search",
      "keyword": finalKeyword,
      "count": requestCount,
      "skill_version": "1.0.5"
    };

    const response = await fetch('https://i.weread.qq.com/api/agent/gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(wereadPayload)
    });

    const data = await response.json();
    console.log('=== 微信读书返回的真实数据 ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('==============================');

    // 随机模式下，打乱顺序并截取
    if (mode === 'random' && data && data.books && data.books.length > 0) {
      // 数组乱序
      data.books = data.books.sort(() => Math.random() - 0.5);
      // 截取前端要求的数量（1-3本）
      data.books = data.books.slice(0, count);
    }

    res.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.get('/', (req, res) => res.send('Weread Proxy is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));