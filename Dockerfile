FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for Hugo sites
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Hugo site
COPY public/ /usr/share/nginx/html/

EXPOSE 80
