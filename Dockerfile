# Non-root nginx serving a pre-built Hugo site.
# The public/ directory must be built before `docker build` (as the CI does
# via `hugo --minify` in a preceding step).
FROM nginxinc/nginx-unprivileged:alpine@sha256:a8d5564c3354241473c1e152d5dd3281ab4224edb61b23c291e0bfd9854687a1

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for Hugo sites
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built Hugo site (must exist in the build context)
COPY public/ /usr/share/nginx/html/

USER 101
EXPOSE 8080
