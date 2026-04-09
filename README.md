# FutureMind task

## Run app
```sh
make start
```

## Endpoints

### Upload Image
```sh
curl --request POST \
  --url http://localhost:3000/images \
  --header 'content-type: multipart/form-data' \
  --form width=1280 \
  --form height=720 \
  --form file=@/home/msidor-pl/Pictures/your-picture.jpeg \
  --form 'title=sometitle'
```

### Get Images
```sh
curl --request GET \
  --url 'http://localhost:3000/images?title=filter&limit=5&page=1'
```

### Get Image by ID
```sh
curl --request GET \
  --url 'http://localhost:3000/images/1'
```

### OpenAPI Docs
```sh
http://localhost:3000/api
```

## Run tests
```sh
make test-unit
```

## Run E2E tests
```sh
make test-e2e
```