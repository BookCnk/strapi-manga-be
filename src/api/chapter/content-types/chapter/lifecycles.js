"use strict";

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    console.log("Chapter created:", result);

    const chapter = await strapi.entityService.findOne(
      "api::chapter.chapter",
      result.id,
      {
        populate: { manga: true },
      },
    );

    const mangaId = chapter.manga?.id;
    const chapterId = chapter.id;

    if (!mangaId || !chapterId) return;

    const manga = await strapi.entityService.findOne(
      "api::manga.manga",
      mangaId,
      {
        populate: { chapters: true },
      },
    );

    const existingChapterIds = (manga.chapters || []).map((c) => c.id);

    if (!existingChapterIds.includes(chapterId)) {
      await strapi.entityService.update("api::manga.manga", mangaId, {
        data: {
          chapters: [...existingChapterIds, chapterId],
        },
      });
    }

    await updateMangaChapterInfo(mangaId);
  },

  async afterUpdate(event) {
    const { result } = event;

    const chapter = await strapi.entityService.findOne(
      "api::chapter.chapter",
      result.id,
      {
        populate: { manga: true },
      },
    );

    const mangaId = chapter.manga?.id;
    const chapterId = chapter.id;

    if (!mangaId || !chapterId) return;

    const manga = await strapi.entityService.findOne(
      "api::manga.manga",
      mangaId,
      {
        populate: { chapters: true },
      },
    );

    const existingChapterIds = (manga.chapters || []).map((c) => c.id);

    if (!existingChapterIds.includes(chapterId)) {
      await strapi.entityService.update("api::manga.manga", mangaId, {
        data: {
          chapters: [...existingChapterIds, chapterId],
        },
      });
    }

    await updateMangaChapterInfo(mangaId);
  },
};

async function updateMangaChapterInfo(mangaId) {
  if (!mangaId) return;

  const chapters = await strapi.entityService.findMany("api::chapter.chapter", {
    filters: { manga: { id: mangaId } },
    sort: [{ chapter_number: "desc" }],
    limit: 1,
  });

  const latestChapter = chapters?.[0];
  if (latestChapter) {
    await strapi.entityService.update("api::manga.manga", mangaId, {
      data: {
        last_chapter_number: latestChapter.chapter_number,
        last_updated_at: new Date().toISOString(),
      },
    });
  }
}
