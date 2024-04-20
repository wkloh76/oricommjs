# WebNodeJS

## Objective

- This is nodejs web server engine module which use express framework manage http request and url routing.

## Startup

1. Below code apply to your components project if the web design use 

```
[webnodejs]
[webnodejs.bodyParser]
json = { limit = "1mb" }
urlencoded = { limit = "1mb", extended = true, parameterLimit = 2000 }
raw = { limit = "10mb" }
text = { limit = "1mb" }

[webnodejs.session]
secret = "testing"
path = "/index"
httpOnly = true
resave = false
saveUninitialized = false
cookie = { secure = false, maxAge = 1800000 }

[webnodejs.helmet]
contentSecurityPolicy = { directives = { "script-src" = [
  "'self'",
  "example.com",
] } }
```

## Handle package.json dependencies and devdependencies

- Dependencies: The modules will bundle to the project and standy for deployment.
- Devdependencies: The modules will bundle to project for development and testing purpose. The deployment stage can be ignore the modules.
