# WebBun

## Objective

- This is Bun web server engine module which use Hono framework manage RESTFUL API request and url routing.
- Why use Bun:
  1. 100% Node.js compatibility unless some third party modules.
  2. Startup faster 4x than Node.js
  3. Built in major API such as：
     - SQLite driver
     - Postgres driver
     - S3 Cloud Storage driver
     - HTTP server
     - HTTP Route
     - WebSocket server
- Why use Hono framework:
  1.  100% ExpressJS compatibility.
  2.  Ultrafast 🚀 - The router RegExpRouter is really fast. Not using linear loops. Fast.
  3.  Lightweight 🪶 - The hono/tiny preset is under 12kB. Hono has zero dependencies and uses only the Web Standard API.
  4.  Multi-runtime 🌍 - Works on Cloudflare Workers, Fastly Compute, Deno, Bun, AWS Lambda, Lambda@Edge, or Node.js. The same code runs on all platforms.
  5.  Batteries Included 🔋 - Hono has built-in middleware, custom middleware, and third-party middleware. Batteries included.
  6.  Delightful DX 😃 - Super clean APIs. First-class TypeScript support. Now, we've got "Types".

## Handle package.json dependencies and devdependencies

- Dependencies: The modules will bundle to the project and standy for deployment.
- Devdependencies: The modules will bundle to project for development and testing purpose. The deployment stage can be ignore the modules.
