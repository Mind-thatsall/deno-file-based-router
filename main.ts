import * as http from "https://deno.land/std@0.188.0/http/mod.ts";
import { debounce } from "https://deno.land/std@0.188.0/async/debounce.ts";

const routes: URLPattern[] = [];
routes.push(new URLPattern({ pathname: "/" }));

async function handler(req: Request) {
  for (const route in routes) {
    console.log(routes[route]);
    if (routes[route].exec(req.url)) {
      if (routes[route].pathname === "/") {
        return new Response(
          await Deno.readFile(`./routes${routes[route].pathname}index.html`),
          { status: 200 },
        );
      } else {
        return new Response(
          await Deno.readFile(`./routes${routes[route].pathname}/index.html`),
          { status: 200 },
        );
      }
    }
  }
  return new Response("404", { status: 404 });
}

http.serve(
  handler,
  { port: 3000 },
);

function createRoutes(eventName: string, pathname: string[]) {
  const fullPathName = pathname.slice(pathname.indexOf("routes") + 1).join(
    "/",
  );
  if (
    eventName === "create" && !pathname[pathname.length - 1].includes(".html")
  ) {
    routes.push(
      new URLPattern({ pathname: `/${fullPathName}` }),
    );
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
    createRoutes(ev.kind, ev.paths[0].split("/"));
  }
}
