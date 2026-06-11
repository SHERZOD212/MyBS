FROM nginx:alpine

COPY . /usr/share/nginx/html/

RUN sed -i 's/index.html index.htm/MyBS.html index.html index.htm/g' /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]