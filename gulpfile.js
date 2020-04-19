const { series, watch, src, dest } = require('gulp')
const rollup = require('rollup')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const less = require('gulp-less')
const concat = require('gulp-concat')
const cssmin = require('gulp-cssmin')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssgrace = require('cssgrace')
const resolve = require('@rollup/plugin-node-resolve')
const babel = require('rollup-plugin-babel')

// 拷贝 fonts 文件
function copyFonts(cb) {
  src('./src/fonts/*').pipe(dest('./release/fonts'))
  cb()
}

// 处理 css
function css(cb) {
  src('./src/less/**/*.less')
    .pipe(less())
    // 产出的未压缩的文件名
    .pipe(concat('wangEditor.css'))
    // 配置 postcss
    .pipe(postcss([
      autoprefixer,
      cssgrace
    ]))
    .pipe(dest('./release'))
    // 产出的压缩后的文件名
    .pipe(rename('wangEditor.min.css'))
    .pipe(cssmin())
    .pipe(dest('./release'))
  cb()
}

// 处理 JS
async function script(cb) {
  try {
    const bundle = await rollup.rollup({
      input: './src/js/index.js',
      plugins: [
        resolve(),
        babel({
          exclude: 'node_modules/**' // 不处理 node_modules
        })
      ]
    })
    await bundle.write({
      // iife 规范下的全局变量名称
      name: 'wangEditor',
      // 产出的未压缩的文件名
      file: './release/wangEditor.js',
      // 产出文件使用 umd 规范（即兼容 amd cjs 和 iife）
      format: 'umd'
    })

    // 待 rollup 打包 js 完毕之后，再进行如下的处理：
    src('./release/wangEditor.js')
      // 压缩
      .pipe(uglify())
      // 产出的压缩的文件名
      .pipe(rename('wangEditor.min.js'))
      // 生成 sourcemap
      .pipe(dest('./release'))
  } catch (e) {
    console.error(e)
  }

  cb()
}

async function transpileJS(cb) {
  try {
    const bundle = await rollup.rollup({
      input: './src/js/index.js',
      plugins: [
        resolve(),
        babel({ exclude: 'node_modules/**' })
      ]
    })

    await bundle.write({
      name: 'wangEditor',
      file: './release/wangEditor.js',
      format: 'umd'
    })
  } catch (e) {
    console.error(e)
  }
  cb()
}

function transpileCSS(cb) {
  src('./src/less/**/*.less')
    .pipe(less())
    .pipe(concat('wangEditor.css'))
    .pipe(postcss([autoprefixer, cssgrace]))
    .pipe(dest('./release'))
  cb()
}

function watchFileChange(cb) {
  // 监听 js 原始文件的变化
  watch('./src/js/**/*.js', transpileJS)
  // 监听 css 原始文件的变化
  watch('./src/less/**/*.less', transpileCSS)

  cb()
}

exports.watch = watchFileChange

exports.transpileCSS = transpileCSS

exports.transpileJS = transpileJS

// 默认任务配置
exports.default = series(copyFonts, css, script)
