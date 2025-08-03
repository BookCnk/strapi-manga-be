"use strict";

/**
 * chapter controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController("api::chapter.chapter", ({ strapi }) => {
  const defaultController = createCoreController("api::chapter.chapter");

  return {
    ...defaultController({ strapi }),

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

      return ctx.send(result[0]);
    },
    async getChaptersBySlug(ctx) {
      const { slug } = ctx.params;

      const manga = await strapi.entityService.findMany("api::manga.manga", {
        filters: { slug },
        fields: ["id"],
      });

      if (!manga || manga.length === 0) {
        return ctx.notFound("Manga not found");
      }

      const mangaId = manga[0].id;

      const chapters = await strapi.entityService.findMany(
        "api::chapter.chapter",
        {
          filters: { manga: mangaId },
          sort: { chapter_number: "asc" },
          fields: ["id", "chapter_number"],
        },
      );

      ctx.send(chapters);
    },

    async incrementView(ctx) {
      const { slug } = ctx.request.body;

      if (!slug) {
        return ctx.badRequest("slug is required");
      }

      const entity = await strapi.db.query("api::chapter.chapter").findOne({
        fields: ["id","slug"],
        where: { slug },
        populate: {
          manga: {
            fields: ["id"],
          },
        },
      });

      if (!entity) {
        return ctx.notFound("Chapter not found");
      }

      await strapi.db.query("api::chapter.chapter").update({
        where: { id: entity.id },
        data: {
          views: (parseInt(entity.views, 10) || 0) + 1,
        },
      });

      await strapi.db.query("api::manga.manga").update({
        where: { id: entity.manga.id },
        data: {
          views: (parseInt(entity.manga.views, 10) || 0) + 1,
        },
      });
      ctx.send({
        message: "View count incremented",
      });
    },
  };
});
