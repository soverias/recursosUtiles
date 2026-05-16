# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Store at root, sub-apps each with their own base-href
RUN npm run build -- store         --configuration=production
RUN npm run build -- secret-friend --configuration=production --base-href=/secret-friend/
RUN npm run build -- calculator    --configuration=production --base-href=/calculator/
RUN npm run build -- bang-game     --configuration=production --base-href=/bang-game/

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Store at root
COPY --from=build /app/dist/store/browser         /usr/share/nginx/html/

# Sub-apps each in their own subdirectory
COPY --from=build /app/dist/secret-friend/browser /usr/share/nginx/html/secret-friend/
COPY --from=build /app/dist/calculator/browser    /usr/share/nginx/html/calculator/
COPY --from=build /app/dist/bang-game/browser     /usr/share/nginx/html/bang-game/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
