"use strict";

/**
 * chapter controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController("api::chapter.chapter", ({ strapi }) => {
  const defaultController = createCoreController("api::chapter.chapter");
  
  return {
    ...defaultController({strapi}),

    async findBySlugAndChapterNumber(ctx) {
      const { slug, chapterNumber } = ctx.params;

      const result = await strapi.db.query("api::chapter.chapter").findMany({
        where: {
          chapter_number: Number(chapterNumber),
          manga: {
            slug: slug,
          },
        },
        populate: ["manga"],
      });

      if (!result || result.length === 0) {
        return ctx.notFound("Chapter not found");
      }

   
      return ctx.send(entries[0]);
    },
  };
});
