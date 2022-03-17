FROM library/nginx:1.19.0-alpine

COPY ./docker/dc_dev_config/nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
