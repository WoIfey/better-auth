import { generator } from "./generator";
import { logo } from "./logo";
import type { BetterAuthPlugin, LiteralString } from "../../types";
import { APIError, createAuthEndpoint } from "../../api";

const getHTML = (apiReference: Record<string, any>) => `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json">
    ${JSON.stringify(apiReference)}
    </script>
	 <script>
      var configuration = {
	  	favicon: "data:image/svg+xml;utf8,${encodeURIComponent(logo)}",
	   	theme: "saturn",
        metaData: {
			title: "Better Auth API",
			description: "API Reference for your Better Auth Instance",
		}
      }

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    </script>
	  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export interface OpenAPIOptions {
	/**
	 * The path to the OpenAPI reference page
	 *
	 * keep in mind that this path will be appended to the base URL `/api/auth` path
	 * by default, so if you set this to `/reference`, the full path will be `/api/auth/reference`
	 *
	 * @default "/reference"
	 */
	path?: LiteralString;
	/**
	 * Disable the default reference page that is generated by Scalar
	 *
	 * @default false
	 */
	disableDefaultReference?: boolean;
}

export const openAPI = <O extends OpenAPIOptions>(options?: O) => {
	const path = (options?.path ?? "/reference") as "/reference";
	return {
		id: "open-api",
		endpoints: {
			generateOpenAPISchema: createAuthEndpoint(
				"/open-api/generate-schema",
				{
					method: "GET",
				},
				async (ctx) => {
					const schema = await generator(ctx.context, ctx.context.options);
					return ctx.json(schema);
				},
			),
			openAPIReference: createAuthEndpoint(
				path,
				{
					method: "GET",
					metadata: {
						isAction: false,
					},
				},
				async (ctx) => {
					if (options?.disableDefaultReference) {
						throw new APIError("NOT_FOUND");
					}
					const schema = await generator(ctx.context, ctx.context.options);
					return new Response(getHTML(schema), {
						headers: {
							"Content-Type": "text/html",
						},
					});
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
