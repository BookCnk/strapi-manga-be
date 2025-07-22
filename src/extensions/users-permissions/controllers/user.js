"use strict";

const { sanitize } = require("@strapi/utils");

module.exports = {
  async customMe(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("You're not logged in");
    }

    const userWithFields = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: user.id },
        populate: {
          profile_image: true,
          bookmarks: {
            populate: {
              manga: {
                fields: ["id", "title", "slug", "cover_image_url"],
              },
            },
          },
        },
      });

    const sanitizedUser = await sanitize.contentAPI.output(
      userWithFields,
      strapi.getModel("plugin::users-permissions.user"),
    );

    return sanitizedUser;
  },
};
