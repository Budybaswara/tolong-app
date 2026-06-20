FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/admin/package.json apps/admin/package.json
RUN npm install --workspace apps/admin
FROM deps AS build
COPY apps/admin apps/admin
WORKDIR /app/apps/admin
RUN npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/admin/.next/standalone ./
COPY --from=build /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build /app/apps/admin/public ./apps/admin/public
EXPOSE 3000
CMD ["node","apps/admin/server.js"]
