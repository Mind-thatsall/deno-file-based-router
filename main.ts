import { debounce } from "https://deno.land/std@0.188.0/async/debounce.ts";
import {
  createOrDeleteRoutes,
  createRoutesOnLoad,
  createValidPathName,
} from "./createOrDeleteRoutes.ts";
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";

const routes: Array<URLPattern> = [];
routes.push(new URLPattern({ pathname: "/" }));
const alreadyExistingPaths = new Set<string>();
createRoutesOnLoad(alreadyExistingPaths, routes, "./routes");

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

serve(
  handler,
  { port: 3000 },
);

const log = debounce((ev: Deno.FsEvent) => {
  console.log("[%s] %s", ev.kind, ev.paths[0]);
}, 200);

const watcher = Deno.watchFs("./");
let isAValidRoute = false;

for await (const ev of watcher) {
  log(ev);
  const pathname = createValidPathName(ev.paths[0].split("/"));

  if (ev.kind === "create" && !alreadyExistingPaths.has(pathname)) {
    console.log(ev.kind);
    await Deno.lstat(ev.paths[0])
      .then((file: Deno.FileInfo) => {
        alreadyExistingPaths.add(pathname);
        isAValidRoute = file.isDirectory;
      })
      .catch((err: Error) => console.error(err));
  } else {
    isAValidRoute = alreadyExistingPaths.has(pathname);
  }

  if (ev.paths[0].includes("routes") && isAValidRoute) {
    createOrDeleteRoutes(routes, ev.kind, pathname);
  }
}
