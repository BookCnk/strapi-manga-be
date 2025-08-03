const cron = require("node-cron");

// module.exports = {
//   start(strapi) {
//     // ✅ ทุก 1 ชั่วโมง: อัปเดต total views ของ manga จาก chapters
//     // cron.schedule("0 * * * *", async () => {
//     cron.schedule("*/1 * * * *", async () => {
//       try {
//         const mangas = await strapi.db.query("api::manga.manga").findMany({
//           populate: {
//             chapters: {
//               fields: ["views"],
//             },
//           },
//         });

//         for (const manga of mangas) {
//           const totalViews = manga.chapters.reduce(
//             (sum, chapter) => sum + (parseInt(chapter.views, 10) || 0),
//             0,
//           );

//           await strapi.db.query("api::manga.manga").update({
//             where: { id: manga.id },
//             data: {
//               views: totalViews,
//             },
//           });
//         }

//         strapi.log.info("✅ Manga total views updated every 1 hour");
//       } catch (error) {
//         console.error("❌ Cron Error (hourly):", error);
//       }
//     });

//     // ✅ ทุก 1 ชั่วโมง: อัปเดต views ของ stats จาก chapters
//     // cron.schedule("0 * * * *", async () => {
//     cron.schedule("*/1 * * * *", async () => {
//       try {
//         const now = new Date(); // สมมติได้เวลา Wed Jul 23 2025 06:49:00 GMT+0700

//         const todayStr = now.toISOString();

//         const mangas = await strapi.entityService.findMany("api::manga.manga", {
//           fields: ["id", "title", "views"],
//         });

//         const todayStats = await strapi.db
//           .query("api::manga-view-stat.manga-view-stat")
//           .findMany({
//             where: { date: todayStr },
//             populate: { manga: true },
//           });

//         const statMap = new Map();
//         for (const stat of todayStats) {
//           if (stat.manga?.id) {
//             statMap.set(stat.manga.id, stat);
//           }
//         }

//         for (const manga of mangas) {
//           const currentViews = parseInt(manga.views, 10) || 0;
//           const existingStat = statMap.get(manga.id);

//           if (existingStat) {
//             const lastViews = parseInt(existingStat.lastTotalViews, 10) || 0;
//             const deltaViews = currentViews - lastViews;
//             const safeDelta = deltaViews > 0 ? deltaViews : 0;
//             const totalViews =
//               (parseInt(existingStat.views, 10) || 0) + safeDelta;
//             await strapi.db
//               .query("api::manga-view-stat.manga-view-stat")
//               .update({
//                 where: { id: existingStat.id },
//                 data: {
//                   views: totalViews,
//                   lastTotalViews: currentViews,
//                 },
//               });

//             console.log(
//               `[🔁] Updated stat: ${manga.title} += ${safeDelta} views (รวม = ${totalViews})`,
//             );
//           } else {
//             await strapi.entityService.create(
//               "api::manga-view-stat.manga-view-stat",
//               {
//                 data: {
//                   manga: manga.id,
//                   date: todayStr,
//                   views: currentViews,
//                   lastTotalViews: currentViews,
//                 },
//               },
//             );

//             console.log(
//               `[✅] Created stat: ${manga.title} (${currentViews} views) on ${todayStr}`,
//             );
//           }
//         }

//         // 🗑️ ลบ stat ที่เก่ากว่า 2 เดือน
//         const cutoffDate = new Date();
//         cutoffDate.setMonth(cutoffDate.getMonth() - 2);

//         await strapi.db
//           .query("api::manga-view-stat.manga-view-stat")
//           .deleteMany({
//             where: {
//               date: {
//                 $lt: cutoffDate.toISOString().split("T")[0],
//               },
//             },
//           });

//         console.log(
//           `🗑️ Deleted stats older than ${cutoffDate.toLocaleDateString("th-TH")}`,
//         );
//         strapi.log.info("✅ Hourly manga view stats processed");
//       } catch (error) {
//         console.error("❌ Cron Error (hourly):", error);
//       }
//     });
//   },
// };

module.exports = {
  start(strapi) {
    cron.schedule("*/30 * * * *", async () => {
      try {
        // 🔁 ฟังก์ชันช่วยทำ batching
        async function processInBatches(items, batchSize, handler) {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(handler));
          }
        }

        // STEP 1: อัปเดตหรือสร้าง manga-view-stat
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const updatedMangas = await strapi.entityService.findMany(
          "api::manga.manga",
          {
            fields: ["id", "title", "views"],
          }
        );

        const todayStats = await strapi.db
          .query("api::manga-view-stat.manga-view-stat")
          .findMany({
            where: { date: todayStr },
            populate: { manga: true },
          });

        const yesterdayStats = await strapi.db
          .query("api::manga-view-stat.manga-view-stat")
          .findMany({
            where: { date: yesterdayStr },
            populate: { manga: true },
          });

        const todayMap = new Map();
        for (const stat of todayStats) {
          if (stat.manga?.id) todayMap.set(stat.manga.id, stat);
        }

        const yesterdayMap = new Map();
        for (const stat of yesterdayStats) {
          if (stat.manga?.id) yesterdayMap.set(stat.manga.id, stat);
        }

        await processInBatches(updatedMangas, 50, async (manga) => {
          const currentViews = parseInt(manga.views, 10) || 0;
          const todayStat = todayMap.get(manga.id);
          const yesterdayStat = yesterdayMap.get(manga.id);

          if (todayStat) {
            const lastViews = yesterdayStat
              ? parseInt(yesterdayStat.lastTotalViews, 10) || 0
              : todayStat.lastTotalViews || 0;

            const deltaViews = currentViews - lastViews;
            const safeDelta = deltaViews > 0 ? deltaViews : 0;

            await strapi.db
              .query("api::manga-view-stat.manga-view-stat")
              .update({
                where: { id: todayStat.id },
                data: {
                  views: safeDelta,
                  lastTotalViews: currentViews,
                },
              });

            console.log(
              `[🔁] Updated stat: ${manga.title} += ${safeDelta} views (รวม = ${currentViews}, จาก ${lastViews})`
            );
          } else {
            const lastTotal = yesterdayStat
              ? parseInt(yesterdayStat.lastTotalViews, 10) || 0
              : 0;

            await strapi.entityService.create(
              "api::manga-view-stat.manga-view-stat",
              {
                data: {
                  manga: manga.id,
                  date: todayStr,
                  views: 0,
                  lastTotalViews: lastTotal,
                },
              }
            );

            console.log(
              `[✅] Created stat: ${manga.title} (0 views) on ${todayStr}`
            );
          }
        });

        // STEP 2: ลบข้อมูลเก่ากว่า 2 เดือน
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 2);

        await strapi.db
          .query("api::manga-view-stat.manga-view-stat")
          .deleteMany({
            where: {
              date: {
                $lt: cutoffDate.toISOString().split("T")[0],
              },
            },
          });

        console.log(
          `🗑️ Deleted stats older than ${cutoffDate.toLocaleDateString("th-TH")}`
        );
        strapi.log.info("✅ Manga stats updated and cleaned");
      } catch (error) {
        console.error("❌ Cron Error:", error);
      }
    });
  },
};
