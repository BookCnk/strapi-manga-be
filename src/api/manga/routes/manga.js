"use strict";

/**
 * manga router (default + custom)
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::manga.manga", {
  config: {
    findBySlug: {
      auth: false,
    },
    recentUpdates: {
      auth: false,
    },
  },
  async extendRoutes(routes) {
    return [
      ...routes,
      {
        method: "GET",
        path: "/mangas/recent-updates",
        handler: "manga.recentUpdates",
        config: {
          auth: false,
        },
      },
      {
        method: "GET",
        path: "/mangas/:slug",
        handler: "manga.findBySlug",
        config: {
          auth: false,
        },
      },
 
    ];
  },
});
