const path = require('path')
const fs = require('fs')
const {series, paralle, watch, src, dest, task} = require('gulp');
const rollup = require('rollup')
const uglify = require('gulp-uglify')
const sourcemaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')
const less = require('gulp-less')
const concat = require('gulp-concat')
const cssmin = require('gulp-cssmin')
const eslint = require('rollup-plugin-eslint')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssgrace = require('cssgrace')
const resolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const gulpReplace = require('gulp-replace')

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
      // 将 css 引用的字体文件转换为 base64 格式
      .pipe(gulpReplace(/'fonts\/w-e-icon\..+?'/gm, function (fontFile) {
        // fontFile 例如 'fonts/w-e-icon.eot?paxlku'
        fontFile = fontFile.slice(0, -1).slice(1)
        fontFile = fontFile.split('?')[0]
        const ext = fontFile.split('.')[1];
        // 读取文件内容，转换为 base64 格式
        const filePath = path.resolve(__dirname, 'release', fontFile);
        const content = fs.readFileSync(filePath);
        const base64 = content.toString('base64');
        // 返回
        return 'data:application/x-font-' + ext + ';charset=utf-8;base64,' + base64
      }))
      // 产出文件的位置
      .pipe(dest('./release'))
      // 产出的压缩后的文件名
      .pipe(rename('wangEditor.min.css'))
      .pipe(cssmin())
      .pipe(dest('./release'))
  cb()
}

// 处理 JS
function script(cb) {
  // rollup 打包 js 模块
  return rollup.rollup({
    // 入口文件
    entry: './src/js/index.js',
    plugins: [
      // 对原始文件启动 eslint 检查，配置参见 ./.eslintrc.json
      eslint({fix: true}),
      resolve(),
      babel({
        exclude: 'node_modules/**' // only transpile our source code
      })
    ]
  }).then(bundle => {
    bundle.write({
      // 产出文件使用 umd 规范（即兼容 amd cjs 和 iife）
      format: 'umd',
      // iife 规范下的全局变量名称
      moduleName: 'wangEditor',
      // 产出的未压缩的文件名
      dest: './release/wangEditor.js'
    }).then(() => {
      // 待 rollup 打包 js 完毕之后，再进行如下的处理：
      src('./release/wangEditor.js')
          // inline css
          .pipe(gulpReplace(/__INLINE_CSS__/gm, function () {
            // 读取 css 文件内容
            const filePath = path.resolve(__dirname, 'release', 'wangEditor.css');
            let content = fs.readFileSync(filePath).toString('utf-8');
            // 替换 \n \ ' 三个字符
            content = content.replace(/\n/g, '').replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
            return content
          }))
          .pipe(dest('./release'))
          .pipe(sourcemaps.init())
          // 压缩
          .pipe(uglify())
          // 产出的压缩的文件名
          .pipe(rename('wangEditor.min.js'))
          // 生成 sourcemap
          .pipe(sourcemaps.write(''))
          .pipe(dest('./release'))
      cb()
    })
  })
}

function dev(cb) {
  // 监听 js 原始文件的变化
  watch('./src/js/**/*.js', script)

  // 监听 css 原始文件的变化
  watch('./src/less/**/*.less', css)

  // 监听 icon.less 的变化，变化时重新拷贝 fonts 文件
  watch('./src/less/icon.less', copyFonts)

  cb()
}

exports.dev = dev

// 默认任务配置
exports.default = series(copyFonts, css, script);
