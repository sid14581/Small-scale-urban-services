FROM node:20-alpine AS build
ARG VITE_AUTH_BYPASS=off
ENV VITE_AUTH_BYPASS=$VITE_AUTH_BYPASS
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/ .
COPY shared/assets/ /tmp/static/
RUN mkdir -p public/assets && find /tmp/static -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) -exec cp {} public/assets/ \;
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
