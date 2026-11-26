# Multi-stage production build for FleetOS Frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy project source
COPY . .

# Build production assets
RUN npm run build

# Production static file server with Nginx
FROM nginx:alpine AS runner

# Copy customized nginx configuration for React Router SPA history fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard web port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
