"use client";

import { createOrbLogin } from "@orbclub/modules/auth";

export const orbLogin = createOrbLogin({
  qr: {
    initUrl: "/api/orb/init-sign-in",
    pollUrl: "/api/orb/poll-sign-in",
    credentials: "id_access",
  },
});
