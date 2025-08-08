FROM node:18-alpine

WORKDIR /app

# copy package, install
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

# copy source
COPY . .

# expose port
EXPOSE 3000

CMD ["node","server.js"]
