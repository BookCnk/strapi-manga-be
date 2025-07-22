"use strict";

module.exports = {
  routes: [
    // ✅ Override /users/me
    {
      method: "GET",
      path: "/users/me",
      handler: "user.customMe",
      config: {
        auth: true,
        policies: [],
      },
    },

    // ✅ Add new public route
    {
      method: "GET",
      path: "/users/public-profile/:username",
      handler: "user.publicProfile",
      config: {
        auth: false, // public access
        policies: [],
      },
    },
  ],
};
