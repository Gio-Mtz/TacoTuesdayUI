import SOCIAL from '../app/core/seo/social-cards.json';

export const environment = {
  production: true,

  apiBaseUrl:
    'https://tacotuesday-api.delightfultree-708c7167.southcentralus.azurecontainerapps.io',

  siteBaseUrl: SOCIAL.siteBaseUrl,

  analyticsMeasurementId: '',
} as const;
