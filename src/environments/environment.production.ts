/**
 * Production configuration. Replaces `environment.ts` in the `production`
 * build configuration via `fileReplacements` in `angular.json`.
 *
 * ⚠️ `apiBaseUrl` is an INFRASTRUCTURE fact, not a code decision: it is the
 * FQDN Azure handed the Container App. It changes whenever the Container Apps
 * *environment* is recreated — which already happened once, when OPS-5 moved
 * the environment from Central US to South Central US to sit next to the SQL
 * server. The old `ambitiousmeadow-...centralus...` host no longer exists.
 *
 * If a deploy starts failing with CORS errors or the form says "no pudimos
 * conectar", check this value against
 * `az containerapp show -n <app> -g <rg> --query properties.configuration.ingress.fqdn`
 * before suspecting the code.
 *
 * The other half of this lives in the API, not here: the Container App needs
 * `Cors__AllowedOrigins__0` set to the Static Web App's origin, or the browser
 * blocks the response even though the API answered. Both halves are one
 * deployment step and are written down together in the US-006 card.
 */
export const environment = {
  production: true,

  /**
   * No trailing slash, on purpose: the interceptor concatenates this with a URL
   * that already starts with `/`. A trailing slash here produces `//api/leads`,
   * which some proxies normalise and some answer with a 404. `environment.spec.ts`
   * fails if one appears.
   */
  apiBaseUrl:
    'https://tacotuesday-api.delightfultree-708c7167.southcentralus.azurecontainerapps.io',
} as const;
