server {
    server_tokens off;

    # Large header support
    large_client_header_buffers 4 32k;

    #ipv4
    listen ${PROXY_PORT};

    #ipv6
    listen [::]:${PROXY_PORT};

    charset UTF-8;

    client_max_body_size 3000M;

    server_name openvino-dl-workbench.com www.openvino-dl-workbench.com;

    # Load configuration files for the default server block.
    include /etc/nginx/default.d/*.conf;
    include /etc/nginx/snippets/security.conf;

    location /socket.io {
        proxy_http_version 1.1;
        proxy_buffering off;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass http://127.0.0.1:${API_PORT}/socket.io;
    }

    location /api/v1/artifact {
        auth_request /auth;
        alias ${OPENVINO_WORKBENCH_DATA_PATH}/artifacts;
        expires off;
    }

    location /auth {
        limit_req zone=basic_limit burst=5;
        internal;
        proxy_pass http://127.0.0.1:${API_PORT}/api/v1/auth;
        proxy_pass_request_body off;
    }

    location /api/v1 {
        limit_req zone=basic_limit burst=5;
        include /etc/nginx/snippets/security.conf;
        proxy_pass  http://127.0.0.1:${API_PORT};
        proxy_connect_timeout      300s;
        proxy_send_timeout         300s;
        proxy_read_timeout         300s;
        add_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        expires off;
    }

    location /jupyter {
        proxy_http_version 1.1;
        proxy_buffering off;
        limit_req zone=basic_limit burst=20;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass http://127.0.0.1:${JUPYTER_PORT};
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' mybinder.org *.mybinder.org user-images.githubusercontent.com data: blob: www.google-analytics.com www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' ws://0.0.0.0:${PROXY_PORT} https://*.google-analytics.com https://www.googletagmanager.com; frame-ancestors 'none'" always;
    }

    location /static {
        alias ${OPENVINO_WORKBENCH_ROOT}/static;
        expires off;
    }

    location / {
        include /etc/nginx/snippets/security.conf;
        root ${OPENVINO_WORKBENCH_ROOT}/static;
        try_files $uri $uri/ /index.html;
        add_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        expires off;
    }
}