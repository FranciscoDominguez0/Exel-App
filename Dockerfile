FROM nginx:alpine
# Copiamos nuestra app.html y la renombramos como index.html para que nginx la sirva por defecto
COPY app.html /usr/share/nginx/html/index.html

EXPOSE 80
