"use strict";

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::chapter.chapter", {
  config: {
    findBySlugAndChapterNumber: {
      auth: false,
    },
    getChaptersBySlug: {
      auth: false,
    },
    incrementView: {
      auth: false,
    },
  },
  async extendRoutes(routes) {
    return [
      ...routes,
      {
        method: "GET",
        path: "/mangas/:slug/chapters",
        handler: "chapter.getChaptersBySlug",
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/mangas/:slug/:chapterNumber",
        handler: "chapter.findBySlugAndChapterNumber",
        config: {
          auth: false,
        },
      },
      {
        method: "POST",
        path: "/mangas/increment-view",
        handler: "chapter.incrementView",
        config: {
          policies: [],
          auth: false, 
        },
      },
    ];
  },
});
