const cron = require('node-cron');

module.exports = {
  start(strapi) {
    // Every 30 minutes
    cron.schedule('0 * * * *', async () => {
      try {
        const mangas = await strapi.db.query("api::manga.manga").findMany({
          populate: {
            chapters: {
              fields: ['views'],
            },
          },
        });

        for (const manga of mangas) {
          const totalViews = manga.chapters.reduce((sum, chapter) => sum + (parseInt(chapter.views, 10) || 0), 0);

          await strapi.db.query("api::manga.manga").update({
            where: { id: manga.id },
            data: {
              views: totalViews,
            },
          });
        }
      } catch (error) {
        console.error("❌ Cron Error:", error);
      }
    });
  }
};
