# Using a local MongoDB database
## Install MongoDB 6.0.8 on macOS Catalina
Follow instructions in below link. For Intel-based Macs select "MacOS x64" as Platform when downloading .tgz file: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x-tarball/
## Install MongoDB Shell (Mongosh)
Follow instructions in below link:
https://www.mongodb.com/docs/mongodb-shell/install/
## Create a configuration file (optional)
This would allow to start MongoDB using such command:
````
mongod --config /usr/local/etc/mongod.conf
````
Follow instructions here:
https://www.mongodb.com/docs/manual/reference/configuration-options/
Example of config file with access control
````
processManagement:
   fork: false
net:
   bindIp: localhost
   port: 27017
storage:
   dbPath: /Users/sm/data/db
systemLog:
   destination: file
   path: "/Users/sm/data/log/mongodb/mongod.log"
   logAppend: true
storage:
   journal:
      enabled: true
security:
  authorization: enabled
````
## Enable access control
https://www.mongodb.com/docs/manual/tutorial/configure-scram-client-authentication/

