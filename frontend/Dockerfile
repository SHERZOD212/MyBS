FROM oven/bun:alpine

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

EXPOSE 3000

ENV PORT 3000

CMD ["bun", "run", "start"]
