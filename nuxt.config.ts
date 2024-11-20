// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", '@pinia-plugin-persistedstate/nuxt'],
  compatibilityDate: "2024-04-03",
  typescript: {
    strict: true,
  },
  devServer: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem',
    }
  },
  runtimeConfig: {
    // Private keys are only available on the server
    // apiSecret: '123',

    // Public keys that are exposed to the client
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID
    }
  },
  devtools: { enabled: true },
  experimental: {
    viewTransition: false,
  },
  app: {
    head: {
      title: "Todoist Task Viewer",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#5bbad5" },
      ],
    },
  },
});