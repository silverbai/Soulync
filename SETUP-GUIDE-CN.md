# Soulync 灵犀 — 零基础部署手册
## 每一步都告诉你点哪里

---

# 先搞懂几个概念（30秒）

**GitHub** = 一个存放代码的网盘。就像你把照片存在iCloud，程序员把代码存在GitHub。你需要它是因为Vercel从GitHub拿代码来部署。

**Supabase** = 你的App的数据库。所有用户信息、聊天记录、匹配结果都存在这里。你不需要懂数据库，只需要复制粘贴一段SQL代码，它就自动建好了。

**Vercel** = 帮你把代码变成网站的服务。你把代码推到GitHub，Vercel自动帮你变成一个任何人都能打开的网址。

**DeepSeek** = 你的App里AI的"大脑"。用户跟AI聊天、AI分析心理画像、AI推荐约会方案——都是DeepSeek在背后干活。

**它们的关系**：
```
你的代码 → 存在 GitHub → Vercel 从 GitHub 拿代码 → 变成网站
                                 ↓
                          网站运行时调用：
                          - Supabase（存数据）
                          - DeepSeek（AI能力）
```

---

# 第一步：注册 GitHub（5分钟）

1. 打开浏览器，输入 **github.com**
2. 页面中间有一个输入框写着 "Email address"，输入你的邮箱
3. 点绿色按钮 **"Sign up for GitHub"**
4. 按提示设置密码（至少15个字符，或8个字符+一个数字+一个小写字母）
5. 选一个用户名（比如 soulync-alex）
6. 它会问你要不要接收邮件通知，选 "n" 跳过
7. 做一个简单的验证题（识别图片之类的）
8. 去你的邮箱，找到GitHub发的验证邮件，点里面的链接
9. 注册完成！

**注册完之后，你需要创建一个"仓库"来存放代码**：

10. 点页面右上角的 **"+"** 号 → 选 **"New repository"**
11. Repository name 填：**soulync**
12. 选 **Public**（公开的，Vercel免费版需要公开仓库）
13. 勾选 **"Add a README file"**
14. 点绿色按钮 **"Create repository"**
15. 你现在有了一个地址：`github.com/你的用户名/soulync`

**然后把代码上传**：

16. 在你的仓库页面，点 **"Add file"** → **"Upload files"**
17. 把我给你的 zip 包解压后，把 soulync 文件夹里的**所有文件和文件夹**拖进去
18. 页面底部，点绿色按钮 **"Commit changes"**
19. 等待上传完成（可能需要1-2分钟）

完成！你的代码现在在GitHub上了。

---

# 第二步：注册 Supabase 并建数据库（10分钟）

1. 打开浏览器，输入 **supabase.com**
2. 点右上角绿色按钮 **"Start your project"**
3. 它会让你选登录方式，选 **"Continue with GitHub"**（用你刚注册的GitHub账号）
4. 授权GitHub访问（点 "Authorize supabase"）
5. 进入Supabase控制台后，点绿色按钮 **"New Project"**
6. 填写：
   - **Name**：soulync
   - **Database Password**：设一个强密码（随便写，但要记住或存到备忘录）
   - **Region**：选离你最近的（如果在美国选 US East，在亚洲选 Singapore）
7. 点 **"Create new project"**
8. 等待大约2分钟，让它初始化

**建数据库表**：

9. 左侧菜单栏，点 **"SQL Editor"**（图标像一个代码终端）
10. 你会看到一个空白的文本编辑框
11. 打开我给你的 zip 包，用记事本/TextEdit 打开 **supabase-schema.sql** 文件
12. 全选复制里面的内容（Ctrl+A 然后 Ctrl+C）
13. 粘贴到 Supabase 的 SQL Editor 里（Ctrl+V）
14. 点右下角蓝色按钮 **"Run"**
15. 如果看到绿色提示 "Success"，说明9张表建好了

16. 清空 SQL Editor 的内容
17. 用记事本打开 **supabase-schema-questions.sql** 文件
18. 同样全选复制 → 粘贴到 SQL Editor → 点 **"Run"**
19. 又看到 "Success"，12 Questions 表也建好了

**拿到你的密钥**：

20. 左侧菜单，点最下面的齿轮图标 **"Project Settings"**
21. 在左侧子菜单点 **"API"**
22. 你会看到几个重要的值，把它们复制保存到一个文本文件里：
    - **Project URL**：长得像 `https://xxxxxx.supabase.co`
    - **anon public** key：一长串字母数字（这是你的 ANON_KEY）
    - **service_role** key：另一长串（点 "Reveal" 才能看到，这是你的 SERVICE_ROLE_KEY）

**重要**：service_role key 是最高权限的密钥，不要分享给任何人！

---

# 第三步：注册 DeepSeek 拿 API Key（5分钟）

1. 打开浏览器，输入 **platform.deepseek.com**
2. 点 **"Sign Up"** 或 **"注册"**
3. 用邮箱或手机号注册
4. 登录后，左侧菜单点 **"API Keys"**
5. 点 **"Create new API key"**
6. 给密钥取个名字（比如 "soulync"）
7. 复制生成的密钥（长得像 `sk-xxxxxxxxxxxxxxxx`）
8. **立刻保存到你的文本文件里！** 这个密钥只显示一次，关掉就看不到了

DeepSeek 新用户有免费额度，够你测试几个月。

---

# 第四步：部署到 Vercel（10分钟）

1. 打开浏览器，输入 **vercel.com**
2. 点 **"Sign Up"** → 选 **"Continue with GitHub"**
3. 授权 Vercel 访问你的 GitHub
4. 进入控制台后，点 **"Add New..."** → **"Project"**
5. 你会看到你的 GitHub 仓库列表，找到 **soulync** → 点 **"Import"**
6. 在 "Configure Project" 页面：
   - **Framework Preset**：应该自动识别为 "Next.js"，如果没有，手动选
   - 展开 **"Environment Variables"** 部分
7. 一个一个添加环境变量（每次填 Name 和 Value，然后点 "Add"）：

   | Name | Value（从你的文本文件复制） |
   |------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | 你的 Supabase service_role key |
   | `AI_PROVIDER` | deepseek |
   | `DEEPSEEK_API_KEY` | 你的 DeepSeek API key |

8. 确认所有5个变量都添加了
9. 点 **"Deploy"**
10. 等待2-3分钟，Vercel 会自动构建和部署
11. 看到 **"Congratulations!"** 和一个彩纸动画，说明成功了
12. 点击预览图或域名链接，你的App就上线了！

你的App地址会是：**soulync-你的用户名.vercel.app**

如果想要自定义域名（比如 soulync.app），可以在 Vercel 的 Settings → Domains 里设置。

---

# 如果你想找人帮你做（Fiverr方案）

如果上面的步骤你觉得太复杂，或者中途遇到报错不知道怎么解决，去Fiverr花$50-150找人帮你搞定。

## Fiverr 具体操作步骤

1. 打开浏览器，输入 **fiverr.com**
2. 点右上角 **"Join"** 注册（用Google账号最快）
3. 注册完后，在顶部搜索栏输入：**"deploy Next.js Supabase Vercel"**
4. 按 Enter 搜索

### 怎么筛选靠谱的人

5. 在搜索结果页，左侧筛选：
   - **Seller Level**：选 "Level 2" 或 "Top Rated"（经验丰富）
   - **Budget**：设 $50 - $200
   - **Delivery Time**：选 "Up to 3 days"
6. 看卖家的：
   - 评分（至少 4.8 星）
   - 评价数量（至少 20 个）
   - 简介里是否提到 "Next.js" "Supabase" "Vercel"

### 怎么下单

7. 找到合适的卖家，点进他的页面
8. 点 **"Contact Seller"** 先沟通（不要直接下单）
9. 发这段消息（我帮你写好了，直接复制）：

---

**发给Fiverr开发者的消息（直接复制）**：

```
Hi! I have a complete Next.js project that needs to be deployed. 
Everything is already coded — I just need help with setup and deployment.

What I need you to do:
1. Push my code to my GitHub repository
2. Set up a Supabase project and run 2 SQL files to create the database tables
3. Deploy the project on Vercel with the correct environment variables
4. Verify the app loads and the API routes work

I will provide:
- Complete project ZIP file (Next.js + TypeScript)
- Two SQL schema files
- Environment variables (Supabase keys + DeepSeek API key)
- A README with setup instructions

The tech stack is: Next.js 14, Supabase, DeepSeek API (OpenAI-compatible), Vercel.

This should take about 1-2 hours for someone experienced. 
What's your price and timeline?
```

---

10. 等卖家回复，确认价格和时间
11. 如果满意，点 **"Continue"** → 下单支付
12. 把我给你的 **soulync-mvp-v2.zip** 文件发给他
13. 同时发给他你的：
    - GitHub 账号和密码（或者邀请他为你仓库的 collaborator）
    - Supabase 的 URL 和两个 Key
    - DeepSeek 的 API Key

**注意**：不要把密钥发在 Fiverr 的公开评论区，只在私信里发。

14. 等他完成后，他会给你一个网址（xxx.vercel.app）
15. 打开这个网址，看到 Soulync 的欢迎页面 = 完成！

### 完成后做什么

16. **立刻改掉所有密钥！**
    - 去 Supabase → Settings → API → 重新生成 service_role key
    - 去 DeepSeek → API Keys → 删掉旧的，创建新的
    - 去 Vercel → Settings → Environment Variables → 更新为新密钥
17. 这样即使开发者保存了你的密钥，也已经失效了

---

# 遇到问题怎么办？

**Vercel 部署失败（红色错误）**：
→ 截图错误信息发给我，我帮你看

**打开网站是空白页**：
→ 检查环境变量是否漏填了（最常见的问题）

**AI对话没有回复**：
→ 检查 DeepSeek API key 是否正确，是否有免费额度

**任何其他问题**：
→ 直接截图发给我，我一步步帮你排查
