# Routing ules
1. All pages except auth pages (login/register) should have ?tenant=[username] in url
2. All urls are rewritten by server to index.html so regardless of which page loads in browser always app.js runs to initialise the app.
3. A middleware on server checks routes. If request for login or register comes and it has valid token redirect to admin home page. If request for protected paths comes without a valid token remove token cookie and redirect to login.

# Routing Logic for GET requests
GET /login or GET /register {
    if (middleware finds valid token and user exists in db) {
        Redirect to /admin/home?tenant=username
    } else {
        Render page
    }
}

GET /admin/* {
    if (middleware finds valid token and user exists in db) {
        if (there is a tenant query and value is same as username in token) {
            next()
        } else {
            Remove token cookie and redirect to /login
        }
    } else {
        Remove token cookie and redirect to /login
    }
}

GET /any public page {
    url has tenant parameter {
        user has valid token and name in token is same as tenant in url {
            // authenticated user
            Set in state that user is authenticated and his username
            Fetch data from server, save it in state and render page
        } else {
            // normal user
            url requires auth {
                Redirect to login
            } else {
                Fetch data from server, save it in state and render page
            }
        }
    } else {
        Redirect to login
    }
}

# Routing logic for POST requests
POST /login {
    if (server verifies credentials and if they are good) {
        Create an access token with username in payload
        Put token in response header as a http-only cookie
        <!-- Return a json response with username in body
        JS writes username to state and redirect to admin homepage with username in url -->
        Server redirects to /admin/home?tenant=username
    } else {
        Show error and remain on the page
    }
}

