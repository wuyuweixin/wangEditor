import polyfill from './util/poly-fill.js'
import Editor from './editor/index.js'

// 检验是否浏览器环境
try {
  document
} catch (ex) {
  throw new Error('请在浏览器环境下运行')
}

// polyfill
polyfill()

// 返回
export default Editor
