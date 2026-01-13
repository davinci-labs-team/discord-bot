
FROM node:24 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


RUN npm prune --production

FROM node:24-alpine3.21

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user and group for security best practices.
# 'addgroup' and 'adduser' are specific to Alpine Linux.
RUN addgroup --system nodeuser && adduser --system --ingroup nodeuser nodeuser

# Copy only the necessary files from the builder stage:
# 1. package.json and package-lock.json: Needed for 'npm start' or similar
# 2. node_modules: Production dependencies installed in the builder stage
# 3. dist/: The compiled JavaScript output from the TypeScript compilation
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nodeuser


CMD ["node", "dist/index.js"]
