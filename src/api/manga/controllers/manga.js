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

      // นับจำนวนทั้งหมดก่อน
      const countResult = await strapi.db.connection.raw(
        `SELECT COUNT(*) FROM mangas`,
      );
      const totalItems = parseInt(countResult.rows[0].count); // PostgreSQL ส่ง count เป็น string

      // ดึงข้อมูลตามหน้า
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
      const mangaIds = mangas.map((m) => m.id);

      // ดึงข้อมูล manga โดยไม่รวม chapters ก่อน
      const mangasWithoutChapters = await strapi.entityService.findMany(
        "api::manga.manga",
        {
          filters: { id: { $in: mangaIds } },
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

      // ดึงข้อมูล chapters แยกต่างหาก
      const mangasWithChapters = await Promise.all(
        mangasWithoutChapters.map(async (manga) => {
          const chapters = await strapi.entityService.findMany(
            "api::chapter.chapter",
            {
              filters: { manga: manga.id },
              sort: ["release_date:desc"],
              limit: 3,
              fields: [
                "id",
                "title",
                "chapter_number",
                "is_locked",
                "coin_price",
                "release_date",
              ],
            },
          );

          return {
            ...manga,
            chapters: chapters,
          };
        }),
      );

      const sorted = mangaIds
        .map((id) => mangasWithChapters.find((m) => m.id === id))
        .filter(Boolean);

      return ctx.send({
        data: sorted,
        pagination: {
          totalItems,
          pageSize,
          pageIndex: page,
          totalPages: Math.ceil(totalItems / pageSize),
        },
      });
    },
  };
});
