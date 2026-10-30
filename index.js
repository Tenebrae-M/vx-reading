const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const RANDOM_KEYWORDS = [
  '小说', '文学', '推理', '悬疑', '科幻', '奇幻', '武侠', '言情', 
  '历史', '传记', '社会学', '心理学', '哲学', '经济', '商业', '投资', 
  '科技', '人工智能', '编程', '生活', '美食', '旅行', '艺术', '摄影'
];

app.post('/api/weread', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const mode = req.body.mode || 'tag'; 
    const keyword = req.body.keyword || req.body.tag || req.body.query || '小说'; 
    const count = req.body.count || 1; 

    let finalKeyword = keyword;
    let requestCount = 10; // 统一要 10 本

    if (mode === 'random') {
      // 【核心修改】随机抽 3 个词，用空格拼接，作为一次搜索
      const shuffled = [...RANDOM_KEYWORDS].sort(() => Math.random() - 0.5);
      finalKeyword = `${shuffled[0]} ${shuffled[1]} ${shuffled[2]}`; 
    }

    const response = await fetch('https://i.weread.qq.com/api/agent/gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        "api_name": "/store/search",
        "keyword": finalKeyword,
        "count": requestCount,
        "skill_version": "1.0.5"
      })
    });

    const rawData = await response.json();
    
    // 解析数据
    let allBooks = [];
    if (rawData && rawData.results && Array.isArray(rawData.results)) {
      const ebookCategory = rawData.results.find(r => r.title === '电子书');
      if (ebookCategory && ebookCategory.books) {
        allBooks = ebookCategory.books.map(item => item.bookInfo);
      }
    }

    // 去重并打乱
    const uniqueBooks = Array.from(new Map(allBooks.map(b => [b.bookId, b])).values());
    uniqueBooks.sort(() => Math.random() - 0.5);

    // 截取返回
    res.json({ books: uniqueBooks.slice(0, count) });
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.get('/', (req, res) => res.send('Weread Proxy is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));