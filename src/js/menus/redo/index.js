/*
    redo-menu
*/
import $ from '../../util/dom-core.js'

class Redo {
  constructor(editor) {
    this.editor = editor
    this.$elem = $(
      `<div class="w-e-menu">
            <i class="w-e-icon-redo"></i>
        </div>`
    )
    this.type = 'click'

    // 当前是否 active 状态
    this._active = false
  }

  // 点击事件
  onClick(_) {
    // 点击菜单将触发这里

    const editor = this.editor

    // 执行 redo 命令
    editor.cmd.do('redo')
  }
}

export default Redo
