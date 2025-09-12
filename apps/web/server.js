import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Fastify from "fastify"
import { createServer as createViteServer } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer(root = process.cwd(), isProd = process.env.NODE_ENV === "production", hmrPort = undefined) {
  const fastify = Fastify({ logger: true })

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    root,
    logLevel: isProd ? "info" : "error",
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      hmr: {
        port: hmrPort,
      },
    },
    appType: "custom",
  })

  // Register Vite middleware
  await fastify.register(async function (fastify) {
    fastify.addHook("onRequest", async (request, reply) => {
      return new Promise((resolve, reject) => {
        vite.middlewares(request.raw, reply.raw, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  })

  fastify.get("*", async (request, reply) => {
    const url = request.url

    try {
      // 1. Read index.html
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8")

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
      //    and also applies HTML transforms from Vite plugins, e.g. global
      //    preambles from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template)

      // 3. Load the server entry. ssrLoadModule automatically transforms
      //    ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation.
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx")

      // 4. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const { html: appHtml } = await render(url)

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace("<!--ssr-outlet-->", appHtml)

      // 6. Send the rendered HTML back.
      reply.type("text/html").send(html)
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite.ssrFixStacktrace(e)
      throw e
    }
  })

  return { fastify, vite }
}

if (!process.env.VITEST) {
  createServer().then(({ fastify }) =>
    fastify.listen({ port: 5173, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      console.log(`Server started at ${address}`)
    }),
  )
}
