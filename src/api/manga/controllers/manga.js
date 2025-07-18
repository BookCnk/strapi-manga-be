"use strict";

/**
 * manga controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::manga.manga", ({ strapi }) => {
  const defaultController = createCoreController("api::manga.manga");

  return {
    ...defaultController({ strapi }),

    async findBySlug(ctx) {
      const { slug } = ctx.params;

      const entries = await strapi.entityService.findMany("api::manga.manga", {
        filters: { slug },
        populate: ["chapters"],
        limit: 1,
      });

      if (!entries || entries.length === 0) {
        return ctx.notFound("Manga not found");
      }

      return ctx.send(entries[0]);
    },
    async recentUpdates(ctx) {
      const page = parseInt(ctx.query.page) || 1;
      const pageSize = 10;

      const results = await strapi.db.connection.raw(
        `
      SELECT *
  FROM mangas
  ORDER BY last_updated_chapter DESC
  LIMIT ? OFFSET ?
  `,
        [pageSize, (page - 1) * pageSize],
      );

      const mangas = results.rows;

      // ดึง chapters ของ manga แต่ละตัวด้วย (ใช้ entityService แบบ batch)
      const mangaIds = mangas.map((m) => m.id);
      const mangasWithChapters = await strapi.entityService.findMany(
        "api::manga.manga",
        {
          filters: { id: { $in: mangaIds } },
          populate: {
            chapters: {
              sort: ["release_date:desc"],
              fields: [
                "id",
                "documentId",
                "title",
                "chapter_number",
                "is_locked",
                "coin_price",
                "release_date",
              ],
            },
          },
          fields: [
            "id",
            "title",
            "createdAt",
            "updatedAt",
            "publishedAt",
            "slug",
            "language",
            "views",
            "likes",
            "cover_image_url",
            "rating",
            "last_chapter_number",
            "last_updated_chapter",
            "bookmarks",
          ],
        },
      );

      // เรียงตาม latest_chapter_time ที่ดึงมาก่อนหน้า
      const sorted = mangaIds
        .map((id) => {
          const found = mangasWithChapters.find((m) => m.id === id);
          if (!found)
            console.warn(`Manga ID ${id} not found in entityService results`);
          return found;
        })
        .filter(Boolean);

      return ctx.send(sorted);
    },
  };
});
