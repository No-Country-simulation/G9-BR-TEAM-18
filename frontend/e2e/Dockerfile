FROM mcr.microsoft.com/playwright:v1.62.0-jammy

WORKDIR /app

# Copy frontend source
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY frontend/ .

# Copy e2e test files
COPY frontend/e2e/ ./e2e/

# Install Playwright browsers (already included in base image)
RUN npx playwright install chromium

CMD ["npx", "playwright", "test", "--config=e2e/playwright.config.ts"]
