"use strict";

module.exports = {
  routes: [
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
