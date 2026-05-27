# 使用官方轻量级 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

RUN apk add --no-cache ca-certificates
# 复制依赖配置文件并安装依赖
COPY package*.json ./
RUN npm install --production

# 复制所有后端源码
COPY . .

# 暴露端口（必须和你的 Node.js 监听端口一致，云托管推荐用 80 或 3000）
EXPOSE 80

# 启动命令
CMD ["node", "src/index.js"]
