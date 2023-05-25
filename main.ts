import {
  createOrDeleteRoutes,
  createRoutesOnLoad,
  createValidPathName,
} from "./createOrDeleteRoutes.ts";
import { serve } from "https://deno.land/std@0.189.0/http/server.ts";

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

const watcher = Deno.watchFs("./routes");
let isAValidRoute = false;

for await (const ev of watcher) {
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

  if (isAValidRoute) {
    createOrDeleteRoutes(routes, ev.kind, pathname);
  }
}
