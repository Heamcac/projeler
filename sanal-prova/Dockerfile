FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY web ./web
RUN npm run web:build
RUN npx tsc --target ES2023 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --esModuleInterop --skipLibCheck --outDir dist --rootDir . src/main.ts src/migrate.ts src/create-admin.ts

FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/web/dist ./web/dist
COPY drizzle ./drizzle
USER node
EXPOSE 3100
CMD ["node", "dist/src/main.js"]
