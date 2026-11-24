# Reading List

Web Programming, Fall 2026 · Assignment 9

Reading List is a React app backed by an Express 5 REST API. The API starts with six books in memory. You can search, filter, sort, add, edit, rate and delete books, and see statistics for the collection.

## Run locally

Use Node.js 26 LTS and npm. Run the API and client in separate terminals.

```sh
# Terminal 1, from the repository root
cd server
npm ci
npm start
```

```sh
# Terminal 2, from the repository root
cd client
npm ci
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:3000`. For server development, `npm run dev` starts Node in watch mode. To build the client, run `npm run build` in `client/` after setting up its `.env`.

| Variable | Default or example | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Express listening port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Exact origin permitted by the API's CORS middleware |
| `VITE_API_URL` | `http://localhost:3000` in `.env.example` | Express base URL, without `/api` |

The scheme, hostname and port all form part of the origin. Open the client on the same origin configured in `CLIENT_ORIGIN`. If you change the client URL or the API port, update the corresponding variable and restart that process.

## Files

| Path | Purpose |
| --- | --- |
| `server/server.js` | Express configuration, REST handlers and JSON errors |
| `server/booksStore.js` | Seed books, asynchronous reads and writes, filtering and statistics |
| `server/validate.js` | Manual validation and client-facing request errors |
| `client/src/api/books.js` | Base URL, query strings, Fetch API and response parsing |
| `client/src/App.jsx` | List and statistics requests plus mutation coordination |
| `client/src/components/` | Book filters, book list, form and statistics panel |
| `client/.env.example` | Local API URL example |

## API reference

| Method | Path | Success |
| --- | --- | --- |
| `GET` | `/api/books` | `200` with the matching page of books |
| `GET` | `/api/books/:id` | `200` with one book |
| `POST` | `/api/books` | `201` with the created book and `Location` header |
| `PUT` | `/api/books/:id` | `200` with the replacement |
| `PATCH` | `/api/books/:id` | `200` with the updated book |
| `DELETE` | `/api/books/:id` | `204` with an empty body |
| `GET` | `/api/stats` | `200` with counts and average rating |

The list accepts `q`, `genre`, `read`, `sort`, `order`, `limit` and `page` together. It defaults to ascending ID order and up to 50 results per page. The React client requests 20 per page. Unrated books appear last in either rating sort order.

For `POST` and `PUT`, send `title`, `author`, `year` and `genre`, plus `read` and `rating` when needed. Omitted `read` and `rating` default to `false` and `null`. `PATCH` preserves omitted fields. To mark a rated book unread, send both `read: false` and `rating: null` in the same patch.

## Reasoning questions

1. **Parameters.** The ID belongs in the path because `/api/books/2` identifies one resource. Genre and sorting describe how to present a collection, so they can be added to the list URL as query parameters. An ID in the query would turn it into a filter on `/api/books` and require deciding whether that collection route should still return an array.

2. **Body parsing.** In a temporary server copy, `express.json()` was moved below the routes and the POST handler logged `req.body`. It was `undefined`, and the same valid JSON request returned `400 Bad Request` with the message asking for a JSON object. Express ran the route before it reached the parser.

3. **One response.** On a temporary server copy, `return` was removed from the early `404` in the single-book handler. The client received the `404`, then the server logged `ERR_HTTP_HEADERS_SENT` when the handler continued into the success response. Returning immediately after the first response prevents the fall-through.

4. **PUT and PATCH.** `PUT` replaced the author and genre for the entry for *The Book of Why*. Its request included its title, year, read flag and rating as part of the same replacement. The following `PATCH` sent just `read` and `rating`. The title, author, year and genre were preserved by the second request.

5. **CORS.** The temporary API ran with `CLIENT_ORIGIN` set to `http://localhost:5999` and received a GET from the React page on port `5173`. Chrome reported that the response lacked `Access-Control-Allow-Origin` and Fetch rejected with `TypeError: Failed to fetch`. The temporary API's request log still recorded `GET /api/books`. Curl returned `200` for the same request because CORS controls browser access to cross-origin responses.

6. **Validation.** Browser checks help people correct input before submitting, but callers can send an HTTP request directly or modify a request afterward. The server validates types, ranges, duplicate titles and authors, and the combined read/rating state before writing. This protects the collection even when there is no React form involved.

7. **State.** A test book was created and an initial GET for its ID returned `200`. The process was then restarted on the same port. The same ID then returned `404`, and statistics showed the original six books. To preserve changes across restarts, the app would need durable storage such as a database or a file.

## Self-study

- `URLSearchParams` encodes individual values when it serializes the query, so text containing `&` or `+` stays within `q`. The API module passes raw values to `set` and serializes once. [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#percent_encoding)
- `localeCompare` returns a negative, zero or positive comparison result. The store uses it for alphabetic sorting and applies the requested direction after deciding where unrated books belong. [MDN localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
- Vite exposes variables with the `VITE_` prefix through `import.meta.env`. The client reads `VITE_API_URL` this way because the browser needs to know where to send requests. [Vite environment variables](https://vite.dev/guide/env-and-mode#env-variables)
- Express provides `res.end()` to finish a response without data. DELETE uses `res.status(204).end()` and the API client returns without parsing JSON when it sees `204`. [Express 5 response API](https://expressjs.com/en/5x/api/response/#res.end)
- Passing an `AbortSignal` to Fetch allows an effect cleanup to cancel a previous request. The list and statistics effects ignore the `AbortError` and check that the request is still active before storing a result. [MDN Fetch cancellation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request)

## Challenges

- Marking a rated book unread changes two fields. The client clears the rating in the same PATCH, and the server validates the merged result before saving.
- Rapidly changing search inputs can leave requests in flight at the same time. During the browser test, a second search canceled a deliberately delayed request and kept the newer results.
- Duplicate checks and immutable replacement have to use the store's current state. The store waits first, then validates and replaces data synchronously, so two simultaneous requests cannot both insert the same title and author.

## Testing evidence

The commands below ran against a fresh Node.js 26 LTS server on port 3000. The crash check used a temporary route, which was removed afterward.

### Browser Network preflight

The browser test opened the React app on `http://localhost:5173` in Chrome and added a book. In the browser's Network events, an `OPTIONS` request to `http://localhost:3000/api/books` preceded `POST /api/books`. The preflight returned `204 No Content` with these response headers.

```text
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Vary: Origin, Access-Control-Request-Headers
```

### `curl --include` transcripts

#### List filtered by genre and read status, sorted by title

```text
$ curl --include --silent --show-error 'http://localhost:3000/api/books?genre=fantasy&read=true&sort=title&order=asc'
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 235
ETag: W/"eb-dKFBZn7wsQNaKZFeh0JlarRbwrI"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":6,"title":"A Wizard of Earthsea","author":"Ursula K. Le Guin","year":1968,"genre":"fantasy","read":true,"rating":null},{"id":2,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":4}]
```

#### Get one book

```text
$ curl --include --silent --show-error http://localhost:3000/api/books/1
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 126
ETag: W/"7e-FKb/RrXcFP+az5pnkH4h5uwbel8"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":1,"title":"The Left Hand of Darkness","author":"Ursula K. Le Guin","year":1969,"genre":"fiction","read":true,"rating":5}
```

#### Statistics before the changes

```text
$ curl --include --silent --show-error http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 127
ETag: W/"7f-n5l/h6xfk4eLI8GDcY8e16ypkDM"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":4,"unread":2,"averageRating":4.7,"byGenre":{"fiction":1,"fantasy":2,"science":1,"history":1,"non-fiction":1}}
```

#### Create a book and check Location

```text
$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"id":987,"title":"  The Book of Why  ","author":"Judea Pearl","year":2018,"genre":"science"}' http://localhost:3000/api/books
HTTP/1.1 201 Created
X-Powered-By: Express
Vary: Origin
Location: /api/books/7
Content-Type: application/json; charset=utf-8
Content-Length: 114
ETag: W/"72-faf9o0cr9xIgQitsd/Y5hGt5tbA"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"The Book of Why","author":"Judea Pearl","year":2018,"genre":"science","read":false,"rating":null}
```

#### Reject a year outside the allowed range

```text
$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"Invalid Year","author":"Example Author","year":999,"genre":"other"}' http://localhost:3000/api/books
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 53
ETag: W/"35-ADNQzWn8/THdZlEouaY9TSKAcq4"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"year must be an integer from 1000 to 2026"}
```

#### Reject a repeated query parameter

```text
$ curl --include --silent --show-error 'http://localhost:3000/api/books?genre=fiction&genre=history'
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 32
ETag: W/"20-dxgBufFyOGtR1C9AwnQjHgeAmvs"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Send genre only once"}
```

#### Get a missing book

```text
$ curl --include --silent --show-error http://localhost:3000/api/books/9999
HTTP/1.1 404 Not Found
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}
```

#### Reject a duplicate with different letter casing

```text
$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"the hobbit","author":"j.r.r. tolkien","year":1937,"genre":"fantasy"}' http://localhost:3000/api/books
HTTP/1.1 409 Conflict
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 60
ETag: W/"3c-YJy0XpDp5agPe/8cl8QkvyagI8A"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book with this title and author already exists"}
```

#### Replace the book with PUT

```text
$ curl --include --silent --show-error -X PUT -H 'Content-Type: application/json' --data '{"title":"The Book of Why","author":"Judea Pearl and Dana Mackenzie","year":2018,"genre":"non-fiction","read":false,"rating":null}' http://localhost:3000/api/books/7
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 137
ETag: W/"89-IbeW3H7mT9TlvpWooqvWCkd2oWE"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"The Book of Why","author":"Judea Pearl and Dana Mackenzie","year":2018,"genre":"non-fiction","read":false,"rating":null}
```

#### Change only the read flag and rating with PATCH

```text
$ curl --include --silent --show-error -X PATCH -H 'Content-Type: application/json' --data '{"read":true,"rating":4}' http://localhost:3000/api/books/7
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 133
ETag: W/"85-ObI82qsmSvO2pI2ftvujdZpIHQQ"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"The Book of Why","author":"Judea Pearl and Dana Mackenzie","year":2018,"genre":"non-fiction","read":true,"rating":4}
```

#### Statistics after the changes

```text
$ curl --include --silent --show-error http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 127
ETag: W/"7f-rhsBzLzhknMgFRIMt8ehKDo9rHo"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":7,"read":5,"unread":2,"averageRating":4.5,"byGenre":{"fiction":1,"fantasy":2,"science":1,"history":1,"non-fiction":2}}
```

#### Delete the book with an empty response

```text
$ curl --include --silent --show-error -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 204 No Content
X-Powered-By: Express
Vary: Origin
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

#### Repeat the delete

```text
$ curl --include --silent --show-error -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 404 Not Found
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}
```

#### Reject malformed JSON as JSON

```text
$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":' http://localhost:3000/api/books
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 50
ETag: W/"32-6MZ7P8GjafPGz4SLpDN/qzoqJvc"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON: check the request body"}
```

#### Return JSON for an unknown API route

```text
$ curl --include --silent --show-error http://localhost:3000/api/no-such-route
HTTP/1.1 404 Not Found
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

#### Forward a thrown async error to middleware

```text
$ curl --include --silent --show-error http://localhost:3000/api/crash
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 32
ETag: W/"20-cI8B1wZuBEyTE5ClDvphKZx7wd0"
Date: Tue, 24 Nov 2026 17:43:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Something went wrong"}
```
