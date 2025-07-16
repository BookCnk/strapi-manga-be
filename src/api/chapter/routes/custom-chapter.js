"use strict";

module.exports = {
  routes: [
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
