export function createValidPathName(pathname: string[]) {
  return "/" + pathname.slice(pathname.indexOf("routes") + 1).join(
    "/",
  );
}

export function createOrDeleteRoutes(
  routes: URLPattern[],
  eventName: string,
  pathname: string,
) {
  const indexOfPathName = routes.findIndex((route: URLPattern) =>
    route.pathname === `${pathname}`
  );

  if (eventName === "create") {
    routes.push(new URLPattern({ pathname: `${pathname}` }));
    printRoutes("create", routes);
  } else if (eventName === "remove" && indexOfPathName !== -1) {
    routes.splice(indexOfPathName, 1);
    printRoutes("remove", routes);
  }
}

export function printRoutes(action: string, routes: URLPattern[]) {
  console.log(`routes after ${action}:`);
  for (const route of routes) {
    console.log(route.pathname);
  }
}

export async function createRoutesOnLoad(
  alreadyExistingPaths: Set<string>,
  routes: URLPattern[],
  dir: string,
) {
  for await (const dirEntry of Deno.readDir(dir)) {
    if (dirEntry.isDirectory) {
      const route = dir + "/" + dirEntry.name;
      const modifiedRoute = route.replace("./routes", "");
      alreadyExistingPaths.add(modifiedRoute);
      routes.push(new URLPattern({ pathname: modifiedRoute }));

      createRoutesOnLoad(alreadyExistingPaths, routes, route);
    }
  }
}
