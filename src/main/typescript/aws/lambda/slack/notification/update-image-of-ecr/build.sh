#!/bin/sh
echo remove dir and zip
rm -rf update-image0of-ecr-dist/

echo compile ts
tsc -p tsconfig.json

echo copy package.json
cp -f ./package.json ./update-image0of-ecr-dist

echo install module
cd update-image0of-ecr-dist
npm install

echo zip
zip -r update-image0of-ecr-dist.zip ./
