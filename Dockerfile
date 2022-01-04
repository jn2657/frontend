FROM node:alpine

ARG WORKPLACE=/pvs-frontend
ARG PORT=3000

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=production

COPY ./ $WORKPLACE

WORKDIR $WORKPLACE

RUN npm i -g pnpm
RUN pnpm i -g serve
RUN pnpm i --frozen-lockfile
RUN rm .eslintrc
RUN pnpm build

RUN mkdir ../to_rm && \
    mv ./* ../to_rm && \
    mv ../to_rm/build ./ && \
    rm -rf ../to_rm

EXPOSE $PORT
CMD ["serve", "-s", "build", "-C"]
