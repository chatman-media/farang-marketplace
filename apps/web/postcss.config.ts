interface PostCSSConfig {
  plugins: Record<string, any>
}

const config: PostCSSConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
