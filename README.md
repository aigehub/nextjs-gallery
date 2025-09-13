This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# prisma数据库的使用

**Prisma** 在一个项目中的典型流程（开发 → 生成客户端 → 使用 → 部署）。这样你以后就知道从零开始该怎么走了 👇

---

## 1️⃣ 安装 & 初始化

在 Next.js / Node.js 项目里：

```bash
npm install prisma @prisma/client
npx prisma init
```

* 这会在项目根目录创建 `prisma/` 文件夹和一个 `schema.prisma`。
* 同时在根目录创建 `.env` 文件，写数据库连接：

```env
DATABASE_URL="file:./data/dev.db"  # SQLite
```

---

## 2️⃣ 编辑 `schema.prisma`

比如：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Girl {
  id        Int     @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
}
```

这个文件就是你的数据库结构（模型）。

---

## 3️⃣ 生成数据库 & Prisma Client

### SQLite

```bash
npx prisma migrate dev --name init   # 生成数据库 + 迁移
```

### 或如果你只是试验：

```bash
npx prisma db push  # 直接把模型推到数据库
```

**注意**：这一步会创建 `data/dev.db` 或你的自定义路径。

然后生成 Prisma Client：

```bash
npx prisma generate
```

（`migrate dev` 会自动 `generate`）

---

## 4️⃣ 在代码里使用 Prisma Client

```js
// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
```

然后在 API 或脚本里：

```js
import prisma from './lib/prisma.js';

await prisma.girl.create({
  data: {
    name: 'Alice'
  }
});

const girls = await prisma.girl.findMany();
console.log(girls);
```

---

## 5️⃣ 测试脚本（比如你的 `tests/test.mjs`）

```js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertData() {
  await prisma.girl.createMany({
    data: [
      { name: 'Anna' },
      { name: 'Bella' },
    ],
  });
  console.log(await prisma.girl.findMany());
}

insertData()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 6️⃣ 部署/生产

* 在部署环境（Vercel、服务器等）配置好 `DATABASE_URL`。
* 执行迁移（`npx prisma migrate deploy`）。
* 部署代码，Prisma Client 按 `.env` 的 URL 连接生产数据库。

---

### 常见坑

* **路径问题**：`file:./xxx.db` 是相对于 `process.cwd()`。
* **忘记生成 Client**：改 schema 后要 `npx prisma generate`。
* **并发实例**：在 Next.js 要复用 PrismaClient，不要每次 new 一个。

---

Prisma 流程图（init → schema → migrate → generate → use）

## Prisma 里做 **CRUD**（增删改查）

就是用 `PrismaClient` 提供的 API：`create` / `findMany` / `update` / `delete` 等。下面我用你之前的 `Girl` 模型举例：

---
### 1️⃣ 建立 PrismaClient

```js
// lib/prisma.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

在脚本里：

```js
import prisma from './lib/prisma.js';
```

---

### 2️⃣ **Create**（新增）

```js
// 新增一条
await prisma.girl.create({
  data: {
    name: 'Alice'
  }
});

// 批量新增
await prisma.girl.createMany({
  data: [
    { name: 'Anna' },
    { name: 'Bella' }
  ]
});
```

---

### 3️⃣ **Read**（查询）

```js
// 查全部
const all = await prisma.girl.findMany();

// 条件查询
const one = await prisma.girl.findFirst({
  where: { name: 'Alice' }
});

// 按ID查询
const byId = await prisma.girl.findUnique({
  where: { id: 1 }
});
```

可以加 `select` 或 `include` 选择字段或关联表。

---

### 4️⃣ **Update**（更新）

```js
// 按ID更新一条
await prisma.girl.update({
  where: { id: 1 },
  data: { name: 'Alice Updated' }
});

// 批量更新
await prisma.girl.updateMany({
  where: { name: { contains: 'A' } },
  data: { name: 'Changed' }
});
```

---

### 5️⃣ **Delete**（删除）

```js
// 删除一条
await prisma.girl.delete({
  where: { id: 1 }
});

// 批量删除
await prisma.girl.deleteMany({
  where: { name: { startsWith: 'B' } }
});
```

---

### 6️⃣ 断开连接

脚本执行完后记得断开连接，避免 Node 卡住：

```js
await prisma.$disconnect();
```

---

💡 可以封装在一个 `async` 函数里：

```js
async function main() {
  await prisma.girl.create({ data: { name: 'Alice' } });
  const girls = await prisma.girl.findMany();
  console.log(girls);
}
main().finally(() => prisma.$disconnect());
```

---
