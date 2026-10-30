const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 极其丰富的随机词库
const RANDOM_KEYWORDS = [
  '小说', '文学', '长篇', '短篇', '推理', '悬疑', '科幻', '奇幻', '武侠', '言情', 
  '历史', '传记', '社会学', '心理学', '哲学', '经济', '商业', '投资', '互联网', 
  '科技', '人工智能', '编程', '生活', '美食', '旅行', '艺术', '摄影', '音乐'
];

app.post('/api/weread', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const mode = req.body.mode || 'tag'; 
    // 修复：前端可能传 keyword、tag 或者 query，这里做个兼容
    const keyword = req.body.keyword || req.body.tag || req.body.query || '小说'; 
    const count = req.body.count || 1; 

    let finalKeyword = keyword;
    let requestCount = 10; // 统一多要一点，方便洗牌

    if (mode === 'random') {
      finalKeyword = RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)];
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

    const rawData = await response.json();
    
    // === 核心修改：解析微信读书复杂的嵌套结构 ===
    let allBooks = [];
    
    // 检查是否存在 results 数组
    if (rawData && rawData.results && Array.isArray(rawData.results)) {
      // 优先找 "电子书" 分类（通常是最准的）
      const ebookCategory = rawData.results.find(r => r.title === '电子书');
      
      if (ebookCategory && ebookCategory.books) {
        // 提取 bookInfo 里的真实数据
        allBooks = ebookCategory.books.map(item => item.bookInfo);
      } else {
        // 如果没有电子书分类，就把所有分类里的书都搜集起来
        rawData.results.forEach(category => {
          if (category.books && Array.isArray(category.books)) {
            category.books.forEach(item => {
              if (item.bookInfo) allBooks.push(item.bookInfo);
            });
          }
        });
      }
    }

    // 如果没拿到书，返回空
    if (allBooks.length === 0) {
      return res.json({ books: [] });
    }

    // === 核心修改：去重、打乱、截取 ===
    // 1. 根据 bookId 去重（防止搜出同名同作者的多版本）
    const uniqueBooks = Array.from(new Map(allBooks.map(b => [b.bookId, b])).values());
    
    // 2. 打乱数组
    uniqueBooks.sort(() => Math.random() - 0.5);

    // 3. 截取前端需要的数量
    const finalBooks = uniqueBooks.slice(0, count);

    // 返回给前端标准格式
    res.json({ books: finalBooks });
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.get('/', (req, res) => res.send('Weread Proxy is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));