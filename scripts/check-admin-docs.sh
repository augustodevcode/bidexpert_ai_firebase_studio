#!/bin/sh
set -e
apk add --no-cache mysql-client
export MYSQL_PWD='M!nh@S3nha2025'
mysql -h mysql-demo -u root --skip-ssl -e "USE bidexpert_demo; SELECT id, email FROM User WHERE email='admin@bidexpert.com.br'; SELECT ud.id, ud.documentTypeId, ud.status, ud.fileUrl FROM UserDocument ud JOIN User u ON ud.userId = u.id WHERE u.email='admin@bidexpert.com.br';"
