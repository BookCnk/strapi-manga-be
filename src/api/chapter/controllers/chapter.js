"use strict";

/**
 * chapter controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController("api::chapter.chapter", ({ strapi }) => {
  console.log("🔥 Custom controller loaded");

  return {
    async findBySlugAndChapterNumber(ctx) {
      const { slug, chapterNumber } = ctx.params;
      console.log("🚀 slug:", slug);
      console.log("📖 chapterNumber:", chapterNumber);

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
        console.log("❌ Not found");
        return ctx.notFound("Chapter not found");
      }

   
      return result[0];
    },
  };
});
