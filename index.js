const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// 允许所有前端跨域请求
app.use(cors());
// 解析 JSON 请求体
app.use(express.json());

// 定义代理接口
app.post('/api/weread', async (req, res) => {
  try {
    // 获取前端传来的 API Key
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    // 向微信读书官方网关发起请求
    const response = await fetch('https://i.weread.qq.com/api/agent/gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(req.body)
    });

    // 获取微信读书返回的数据
    const data = await response.json();
    
    // 把数据原样返回给你的小手机前端
    res.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// 健康检查接口（用来测试 Render 是否活着）
app.get('/', (req, res) => {
  res.send('Weread Proxy is running!');
});

// 监听端口（Render 会自动分配 PORT 环境变量）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});