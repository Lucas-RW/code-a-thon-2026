FROM node:20-slim

# Install dependencies for Expo and sharp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV CI=true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose Metro Bundler and Web ports
EXPOSE 8081

CMD ["npx", "expo", "start", "--tunnel"]
