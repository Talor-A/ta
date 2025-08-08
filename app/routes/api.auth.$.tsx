import type { Route } from "./+types/api.auth.$";
import { auth } from "../lib/auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  return auth.handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  return auth.handler(request);
}
