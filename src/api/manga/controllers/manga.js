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

      // 1. นับจำนวน manga จริง (ไม่ซ้ำ document_id)
      const countResult = await strapi.db.connection.raw(`
    SELECT COUNT(*) FROM (
      SELECT DISTINCT ON (document_id) id
      FROM mangas
    ) AS unique_mangas;
  `);
      const totalItems = parseInt(countResult.rows[0].count);

      // 2. ดึง manga เฉพาะเวอร์ชันล่าสุดของแต่ละ document_id
      const result = await strapi.db.connection.raw(
        `
    SELECT m.*
    FROM mangas m
    ORDER BY  last_updated_chapter DESC
    LIMIT ? OFFSET ?
  `,
        [pageSize, (page - 1) * pageSize],
      );

      const mangas = result.rows;
      const mangaIds = mangas.map((m) => m.id);

      // 3. ดึงข้อมูล manga ที่จำเป็น (ไม่รวม chapters ก่อน)
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

      // 4. ดึง chapters 3 ตอนล่าสุดของแต่ละ manga
      const mangasWithChapters = await Promise.all(
        mangasWithoutChapters.map(async (manga) => {
          const chapters = await strapi.entityService.findMany(
            "api::chapter.chapter",
            {
              filters: { manga: manga.id },
              sort: ["createdAt:desc"],
              limit: 3,
              fields: [
                "id",
                "title",
                "chapter_number",
                "is_locked",
                "coin_price",
                "createdAt",
              ],
            },
          );
          return {
            ...manga,
            chapters,
          };
        }),
      );

      // 5. เรียงตามลำดับ mangaIds เดิม
      const sorted = mangaIds
        .map((id) => mangasWithChapters.find((m) => m.id === id))
        .filter(Boolean);

      // 6. ส่งผลลัพธ์กลับ
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
