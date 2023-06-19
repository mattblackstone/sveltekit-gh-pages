import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import autoprefixer from "autoprefixer";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess({
    scss: true,
    postcss: {
      plugins: [autoprefixer()],
    },
  }),
  kit: {
    adapter: adapter(),
    paths: {
      base: process.env.NODE_ENV === "production" ? "/sveltekit-gh-pages" : "",
    },
  },
};

export default config;
