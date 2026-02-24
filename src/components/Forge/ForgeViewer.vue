<template>
  <div class="containerl">
    <div class="mt-2"
         v-show="showViewer">
      <div class="d-flex justify-space-between">
        <span class="font-weight-bold text-uppercase text-grey-darken-2">
          Items Selected: <span id="items-selected" class="text-red-darken-2">0</span>
        </span>
        <span class="font-weight-bold text-uppercase text-grey-darken-2">
          Navigation Tool: <span id="navigation-tool" class="text-red-darken-2">orbit</span>
        </span>
      </div>
    </div>

    <div
      v-loading="loader"
      :element-loading-text="loaderMessage"
      :element-loading-spinner="loaderIcon"
      element-loading-background="rgba(0, 0, 0, 0.8)"
    >
      <div id="forgeViewer"></div>

      <div class="mt-3 d-flex justify-center">
        <el-button
          v-show="showViewer"
          id="lockCameraBtn"
          class="mr-2 text-white"
          type="danger"
          width="150"
        >
          Lock Camera
        </el-button>

        <el-button
          v-show="showViewer"
          id="UnlockCameraBtn"
          class="ml-2 text-white"
          type="primary"
          width="150"
        >
          Unlock Camera
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import { Buffer } from 'buffer'

import * as forgeService from "@/api/forge.js";
import fileConfig from "@/utils/file-config";

export default {
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
  components: {
  },
  data: () => ({
    loader: true,
    loaderMessage: '正在初始化视窗...',
    loaderIcon: 'el-icon-message-solid',
    showViewer: false,
    translationStatus: '',
    selectedFile: null,
    fileUrl: '',
    objectId: '',
    objectKey: '',
  }),
  async mounted() {
    await this.genView();
  },
  methods: {
    async genView(){
      //初始化
      await this.init();
      //上传模型
      await this.addFile();
    },
    async init() {
      //鉴权
      await forgeService.Authenticate('SJEVtYcdw2XfDwcCsJVBy1ctAAYm1mMqNyIxguxplCTtaD6B', 'Cl7SMY6vSqtCzle7hTGOOdKla319LobfwRqqEKy5PXcUmfh4AlS2wCbO4IXrNsbE');
      //画布初始化
      await forgeService.InitializeViewer();
    },
    async addFile() {
      const that = this;
      this.fileUrl = window.location.origin + fileConfig.previewUrl(this.$store.state.user.name, that.$props.file, this.$store.getters.token)
      // 使用fetch API获取文件
      await fetch(this.fileUrl)
        .then(response => response.blob())
        .then(blob => {
          // 在这里处理blob对象
          that.selectedFile = new File([blob], that.$props.file.name, { type: that.$props.file.contentType });
        })
        .catch(error => {
          // 处理错误
          console.error('Fetch error:', error);
        });

      const reader = new FileReader();

      reader.onload = async (event) => {
        const byteArray = new Uint8Array(event.target.result);

        const objectData = await forgeService.UploadFileToBucket(
          'xdzncloud',
          that.$props.file.name,
          byteArray
        );
        if (objectData.objectId){
          that.objectId = objectData.objectId;
          that.objectKey = objectData.objectKey;
          //查看模型
          await this.PrepareModelForViewer(that.objectId);
        }
      }
      reader.readAsArrayBuffer(that.selectedFile);
    },
    async PrepareModelForViewer(objectId) {
      const modelUrnBase64 = Buffer.from(objectId).toString('base64');
      const jobResult = await forgeService.TranslateModel(modelUrnBase64);
      if (jobResult.result === 'created') {
        this._viewModel(modelUrnBase64);
      } else if (jobResult.result === 'success') {
        const interval = setInterval(async () => {
          const res = await forgeService.CheckTranslationStatus(modelUrnBase64);

          this.translationStatus = res.status;
          this.loaderMessage = '转码进度: ' + res.progress;

          if (this.translationStatus === 'success') {
            clearInterval(interval);
            setTimeout(() => {
              this._viewModel(modelUrnBase64);
            }, 2000);
          }
          else if (this.translationStatus === 'failed' || this.translationStatus === 'timeout') {
            console.log("Translation Model Status", this.translationStatus);
            this.loaderMessage = "Translation Model Status：" + this.translationStatus;
            clearInterval(interval);
          }
        }, 2500);
      }else {
        this.loaderMessage = '无法转码该格式的模型';
        this.loaderIcon = 'el-icon-error';
      }
    },
    async _viewModel(modelUrn) {
      this.showViewer = true;
      this.loaderMessage = '正在渲染模型...';
      await forgeService.ViewModel(modelUrn);

      this.loader = false;
      const viewerWrap = document.querySelector(".adsk-viewing-viewer");
      if (!viewerWrap) return;

      viewerWrap.style.maxHeight = '775px';
      viewerWrap.style.position = "relative";
    },
    DeleteModel() {
      forgeService.DeleteObjectFromBucket('xdzncloud', this.objectKey);
    },
  },
  computed: {
    ...mapState([ 'blueColor', 'redColor' ])
  }
}

</script>

<style>
.containerl {
  padding: 10px;
}
.d-flex {
  display: flex !important;
}
.mt-2 {
  margin-top: 8px !important;
}
.justify-space-between {
  justify-content: space-between !important;
}
.font-weight-bold {
  font-weight: 700 !important;
}
.text-uppercase {
  text-transform: uppercase !important;
}
.text-grey-darken-2 {
  color: #616161 !important;
}
.text-red-darken-2 {
  color: #D32F2F !important;
}
.mt-3 {
  margin-top: 12px !important;
}
.justify-center {
  justify-content: center !important;
}
.ml-2 {
  margin-left: 8px !important;
}
.mr-2 {
  margin-right: 8px !important;
}
.text-white {
  color: #FFFFFF !important;
}

  #forgeViewer {
    margin: 10px;
    height: 65vh;
  }
  .bucket.v-col {
    padding-top: 5px;
    padding-bottom: 0;
  }
  .d.v-col {
    padding-left: 0px;
    padding-right: 0px;
  }
  .full-width .v-list-subheader__text {
    width: 100%;
  }
  .bucket-action {
    margin: 15px 10px;
    margin-bottom: 60px;
    display: flex;
    justify-content: space-between;
  }
  .translation-loader {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(80px, 0);
  }
  .show-env-bg-button {
    /*background: #C62828;*/
    background-image: url('~@/assets/img/openev.png');
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: center;
  }
  .hide-env-bg-button {
    /*background: #2a73c5;*/
    background-image: url('~@/assets/img/closeev.png');
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: center;
  }
</style>
