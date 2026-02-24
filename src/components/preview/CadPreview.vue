<template>
  <div>
    <el-dialog
      title="图纸信息"
      :visible.sync="status"
      top="7.5vh"
      width="80%"
      style="{'padding': 10px}"
      :close-on-click-modal="false"
      :footer="null"
      :before-close="handleClose"
    >
      <ForgeViewer ref="forgeViewer" :file="file" :isTogether.sync="isTogether" :spaceFlag="spaceFlag"></ForgeViewer>
    </el-dialog>

  </div>
</template>

<script>

import ForgeViewer from '@/components/Forge/ForgeViewer.vue'

export default {
  name: 'CadPreview',
  components: { ForgeViewer },
  props: {
    file: {
      type: Object,
      default: function () {
        return {}
      }
    },
    status: {
      type: Boolean,
      default: false
    },
    isTogether: {
      type: Boolean,
      default: function () {
        return false
      }
    },
    spaceFlag: {
      type: String,
      default: undefined
    },
  },
  data() {
    return {

    }
  },
  mounted() {
    console.log(this.file)
  },
  methods: {
    handleClose () {
      this.$refs.forgeViewer.DeleteModel();
      this.$emit('closeDialog') // 取消和 x 按钮的事件，防止重复操作createDialog变量
    },
  }
}
</script>

<style lang="scss" scoped>

</style>

