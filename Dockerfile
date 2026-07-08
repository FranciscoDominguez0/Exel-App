FROM nginx:alpine
# Copiamos nuestra app.html y la renombramos como index.html
COPY app.html /usr/share/nginx/html/index.html
# Copiamos la carpeta de assets (favicon, etc)
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
