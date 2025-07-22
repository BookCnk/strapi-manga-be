"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/user-profile/me",
      handler: "user-profile.me",
      config: {
        auth: {},
        policies: [],
      },
    },
  ],
};
