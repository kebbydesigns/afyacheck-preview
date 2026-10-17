// Keep prototype metadata on the preview origin unless an explicit origin is supplied.
export default {
  origin: process.env.SITE_URL || "http://localhost:8080",
};
