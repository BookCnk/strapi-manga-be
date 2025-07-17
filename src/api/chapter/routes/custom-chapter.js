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
    {
      method: 'GET',
      path: '/manga/:slug/chapters',
      handler: 'chapter.getChaptersBySlug',
      config: {
        auth: false
      }
    }
  ],
};
