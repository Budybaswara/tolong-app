FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspace apps/api
FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npm run prisma:generate && npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh","-c","npx prisma migrate deploy && node dist/main.js"]
