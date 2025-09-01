import { config } from 'eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  ...(await config({ useJSDoc: true })),
  reactHooks.configs['recommended-latest']
]
