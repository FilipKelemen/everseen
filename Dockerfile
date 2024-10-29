FROM node:23
COPY . .
COPY entryPoint.sh /usr/local/bin/entryPoint.sh

ENTRYPOINT ["entryPoint.sh"]
