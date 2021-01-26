#!/bin/sh
echo remove dir and zip
rm -rf update-task-of-ecs-dist/

echo compile ts
tsc -p tsconfig.json

echo copy package.json
cp -f ./package.json ./update-task-of-ecs-dist

echo install module
cd update-task-of-ecs-dist
npm install

echo zip
zip -r update-task-of-ecs-dist.zip ./
