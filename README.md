Hosted on Render at:
https://tournaments.myendpoint.de/

# Run on localhost
- git clone https://github.com/smohadjer/pokerrangliste.git
- npm install
- npm run dev
- Open http://localhost:8000 in browser

You also need to create a .env file in root and add followings values there:
````
db_uri_local = "mongodb://username:password@127.0.0.1:27017"
db_uri_remote = "mongodb+srv://username:password@cluster0.8qwlizm.mongodb.net/?retryWrites=true&w=majority"

development = "true"

admin_username = "[username]"
admin_password = "[password]"

PORT = 8000
````

If in .env file development is set to true, you need to install and start a MongoDB instance on your localhost. To start your database, use command:
`mongod --config /usr/local/etc/mongod.conf`

For information on setting up MongoDB on localhost see MONGODB.md file.
