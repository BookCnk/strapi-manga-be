"use strict";

module.exports = {
  routes: [
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
  ],
};
