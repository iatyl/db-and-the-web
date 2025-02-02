# API Usage
All examples here use the `curl` program, which is available on all UNIX operating systems and Windows Subsystem for Linux, like below:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token <TOKEN>' \
     -X <METHOD> -d '<JSON>' <URL>
```
## Authentication
---

The API endpoints authenticate its users via the access token retrieved from the `Authentication` header.
Here is how to get an access token (valid for 72 hours):
```bash
curl -H 'Content-Type: application/json' \
     -X POST \
     -d '{"username":"bbb","password":"aaaaaaa"}' \
     https://miniproject.gscoursework.thealois.com/api/auth/get-token/
```
---
Sample response (here the access token is in the `data` field):
```bash
{"data":"588d087c-58d1-4129-b610-d13a70309cee","err":null}
```
## Endpoints
### List Public Links
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X GET \
     https://miniproject.gscoursework.thealois.com/api/links/list-public/
```
---
Sample response:
```bash
{"data":[{"name":"bonjovi","alias":"aI","target":"https://www.youtube.com/watch?v=dPLfRZkJdbE","is_dangerous":false,"virus_info":"OK","is_public":true}],"err":null}
```
### List Private Links
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X GET \
     https://miniproject.gscoursework.thealois.com/api/links/list-private/
```
---
Sample response:
```bash
{"data":[{"name":"bonjovi","alias":"aI","target":"https://www.youtube.com/watch?v=dPLfRZkJdbE","is_dangerous":false,"virus_info":"OK","is_public":true},{"name":"google","alias":"-K","target":"https://www.google.com/","is_dangerous":false,"virus_info":"OK","is_public":false},{"name":"wanderer","alias":"qV","target":"https://www.youtube.com/watch?v=f730CwvGUf8","is_dangerous":false,"virus_info":"OK","is_public":false}],"err":null}
```

### List All Accessible Links
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X GET \
     https://miniproject.gscoursework.thealois.com/api/links/list-accessible/
```
---
Sample response:
```bash
{"data":[{"name":"bonjovi","alias":"aI","target":"https://www.youtube.com/watch?v=dPLfRZkJdbE","is_dangerous":false,"virus_info":"OK","is_public":true},{"name":"curl","alias":"Pz","target":"https://curl.se/","is_dangerous":false,"virus_info":"OK","is_public":true},{"name":"google","alias":"-K","target":"https://www.google.com/","is_dangerous":false,"virus_info":"OK","is_public":false},{"name":"wanderer","alias":"qV","target":"https://www.youtube.com/watch?v=f730CwvGUf8","is_dangerous":false,"virus_info":"OK","is_public":false}],"err":null}
```
### Shorten a URL into a Link
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -d '{"name": "stackexchange", "url": "https://tex.stackexchange.com/"}'\
     -X POST \
     https://miniproject.gscoursework.thealois.com/api/links/new/
```
---
Sample response:
```bash
{"data":{"alias":"pV","created":true},"err":null}
```

### Get Link Detail
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X GET \
     https://miniproject.gscoursework.thealois.com/api/link/pv/
```
---
Sample response:
```bash
{"data":{"name":"stackexchange","alias":"pV","target":"https://tex.stackexchange.com/","is_dangerous":false,"virus_info":"OK","is_public":false},"err":null}
```

### Delete a Link
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X DELETE \
     https://miniproject.gscoursework.thealois.com/api/link/pv/
```
---
Sample response:
```bash
{"data":{"deleted":true,"link":{"name":"stackexchange","alias":"pV","target":"https://tex.stackexchange.com/","is_dangerous":false,"virus_info":"OK","is_public":false}},"err":null}
```


### Make a Link Public
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X POST \
     https://miniproject.gscoursework.thealois.com/api/link/make-public/-K/
```
---
Sample response:
```bash
{"data":"Made -K public.","err":null}
```


### Make a Link Private
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X POST \
     https://miniproject.gscoursework.thealois.com/api/link/make-private/-K/
```
---
Sample response:
```bash
{"data":"Made -K private.","err":null}
```

### Ping
Sample request:
```bash
curl -H 'Content-Type: application/json' \
     -H 'Authorization: Token 588d087c-58d1-4129-b610-d13a70309cee' \
     -X GET \
     https://miniproject.gscoursework.thealois.com/api/ping/
```
---
Sample response:
```bash
{"data":{"message":"pong","is_authenticated":true,"whoami":"Linky Web Service"},"err":null}
```
