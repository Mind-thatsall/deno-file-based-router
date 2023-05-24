import * as http from "https://deno.land/std@0.188.0/http/mod.ts";
import { debounce } from "https://deno.land/std@0.188.0/async/debounce.ts";

const routes: Array<URLPattern> = [];
routes.push(new URLPattern({ pathname: "/" }));

async function handler(req: Request) {
  for (const route in routes) {
    if (routes[route].exec(req.url) && routes[route].pathname === "/") {
      return new Response(
        await Deno.readFile(`./routes${routes[route].pathname}index.html`),
        { status: 200 },
      );
    } else if (routes[route].exec(req.url)) {
      return new Response(
        await Deno.readFile(`./routes${routes[route].pathname}/index.html`),
        { status: 200 },
      );
    }
  }

  return new Response("404", { status: 404 });
}

http.serve(
  handler,
  { port: 3000 },
);

function createOrDeleteRoutes(eventName: string, pathname: string[]) {
  const fullPathName = pathname.slice(pathname.indexOf("routes") + 1).join(
    "/",
  );

  const indexOfPathName = routes.findIndex((route) =>
    route.pathname === `/${fullPathName}`
  );

  // check the extension of file to see if it's a directory or a file
  const newDirectory = !pathname[pathname.length - 1].includes(".html");

  if (eventName === "create" && newDirectory) {
    routes.push(new URLPattern({ pathname: `/${fullPathName}` }));
    console.log(routes);
  } else if (eventName === "remove" && indexOfPathName !== -1) {
    routes.splice(indexOfPathName, 1);
    console.log(routes);
  }
}

const log = debounce((ev: Deno.FsEvent) => {
  console.log("[%s] %s", ev.kind, ev.paths[0]);
}, 200);

const watcher = Deno.watchFs("./");

for await (const ev of watcher) {
  log(ev);
  if (ev.paths[0].includes("routes")) {
    createOrDeleteRoutes(ev.kind, ev.paths[0].split("/"));
  }
}
