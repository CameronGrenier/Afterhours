#!/bin/bash
set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOSQL
CREATE DATABASE IF NOT EXISTS cp476_afterhours_test;
GRANT ALL PRIVILEGES ON cp476_afterhours_test.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOSQL

mysql -u root -p"$MYSQL_ROOT_PASSWORD" cp476_afterhours_test \
  < /docker-entrypoint-initdb.d/01_schema.sql