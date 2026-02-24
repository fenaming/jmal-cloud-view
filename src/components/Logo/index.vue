<template>
    <div :style="{width: width + 'px',height: width + 'px'}">
      <el-image v-if="logoUrl" :src="logoUrl" fit="cover" :style="{width: width + 'px',height: width + 'px', padding: padding + 'px'}"></el-image>
      <img v-else src="~@/assets/img/logo.png" fit="cover" ref="image" :style="{width: width + 'px',height: width + 'px', padding: padding + 'px'}"></img>
<!--      <svg-icon v-else icon-class="jmal-cloud" :style="{width: width + 'px',height: width + 'px', padding: padding + 'px'}"/>-->
    </div>
</template>

<script>
import fileConfig from "@/utils/file-config";

export default {
  name: "Logo",
  props: {
    value: {
      type: String,
      default: ''
    },
    width: {
      type: Number,
      default: 50
    },
    padding: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      logoUrl: ''
    }
  },
  watch: {
    'value': {
      handler(value)  {
        if (!value) {
          return
        }
        this.setLogUrl(value)
      },
      immediate: true,
    },
  },
  methods: {
    setLogUrl(name) {
      this.logoUrl = fileConfig.logoUrl(name)
    }
  }
}
</script>

<style scoped>

</style>
