FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --chown=node:node server.js ./
COPY --chown=node:node index.html ./
COPY --chown=node:node styles.css ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src
COPY --chown=node:node docs/week1/backend ./docs/week1/backend

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=Number(process.env.PORT||3000);const req=http.get({host:'127.0.0.1',port,path:'/.well-known/jwks.json',timeout:3000},(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"

CMD ["node", "server.js"]
