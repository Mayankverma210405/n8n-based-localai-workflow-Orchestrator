# frontend/Dockerfile (dev mode: runs vite dev server inside container)
FROM node:20
WORKDIR /app

# copy only package files first for cache efficiency
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# copy the rest of the frontend source
COPY . .

ENV HOST 0.0.0.0
EXPOSE 5173

CMD ["npm", "run", "dev"]