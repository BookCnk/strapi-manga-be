"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/mangas/:slug/chapters",
      handler: "chapter.getChaptersBySlug",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/mangas/:slug/:chapterNumber",
      handler: "chapter.findBySlugAndChapterNumber",
      config: {
        auth: false,
      },
    },
  ],
};
