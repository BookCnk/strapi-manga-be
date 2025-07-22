"use strict";

module.exports = {
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("You're not logged in");
    }

    // ดึง user พร้อม populate bookmarks -> manga
    const userWithFields = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: user.id },
        populate: {
          profile_image: true,
          bookmarks: {
            populate: {
              manga: {
                fields: [
                  "title",
                  "cover_image_url",
                  "updatedAt",
                  "publishedAt",
                  "slug",
                ],
              },
            },
          },
        },
      });

    // กรอง bookmarks ที่ manga ยังไม่ publish
    const publishedBookmarks = (userWithFields.bookmarks || []).filter(
      (bookmark) => bookmark.manga && bookmark.manga.publishedAt,
    );

    // map bookmarks ให้มีเฉพาะฟิลด์ที่ต้องการ
    const mappedBookmarks = publishedBookmarks.map((bookmark) => ({
      title: bookmark.manga.title,
      slug: bookmark.manga.slug, // ✅ เพิ่ม slug ตรงนี้
      cover_image_url: bookmark.manga.cover_image_url,
      updatedAt: bookmark.manga.updatedAt,
    }));

    // ลบข้อมูลที่ไม่จำเป็น
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      profile_image,
      bookmarks,
      ...safeUser
    } = userWithFields;

    safeUser.profile_image_url = profile_image?.url || null;
    safeUser.bookmarks = mappedBookmarks;

    return ctx.send(safeUser);
  },
};
