<template>
  <div class="home">
    <div class="actions">
      <div class="action-item">
        <app-button @click="$router.replace('/voiceorder')">
          <i class="iconify" data-icon="mdi:microphone"></i>
          <span>말로 주문하기</span>
        </app-button>
        <button v-if="showVoiceAssist" class="voice-btn" @click.stop="TTS('말로 주문하기')">
          <i class="iconify" data-icon="mdi:volume-high"></i>
        </button>
      </div>
      <div class="action-item">
        <app-button @click="requestAssistant">
          <i class="iconify" data-icon="mdi:bell"></i>
          <span>도움 요청</span>
        </app-button>
        <button v-if="showVoiceAssist" class="voice-btn" @click.stop="TTS('도움 요청')">
          <i class="iconify" data-icon="mdi:volume-high"></i>
        </button>
      </div>
      <div class="action-item">
        <app-button @click="$router.replace('order')">
          <i class="iconify" data-icon="mdi:touch-app"></i>
          <span>터치로 주문하기</span>
        </app-button>
        <button v-if="showVoiceAssist" class="voice-btn" @click.stop="TTS('터치로 주문하기')">
          <i class="iconify" data-icon="mdi:volume-high"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Action, Mutation, State } from 'vuex-class';

@Component({})
export default class Home extends Vue {
  @State('isElectron') isElectron!: boolean;
  @State('earphoneDetection') earphoneDetection!: boolean;
  @State('showVoiceAssist') showVoiceAssist!: boolean;

  @Mutation('activateEarphoneDetection') activateEarphoneDetection!: Function;

  @Action('startHelloLoop') startHelloLoop!: Function;
  @Action('playAudio', { namespace: 'AudioModule' }) playAudio!: Function;
  @Action('TTS') TTS!: Function;

  @Action('SEND_NOTIFICATION', { namespace: 'FirebaseModule' }) sendNotification!: Function;

  @Watch('earphoneDetection')
  changeEarphoneDetection() {
    if (!this.earphoneDetection) return;
    this.playAudio({ isLocal: true, data: 'home/detection_activated' });
  }

  mounted() {
    navigator.mediaDevices.addEventListener('devicechange', event => {
      if (this.earphoneDetection)
        try {
          this.$router.replace('/voiceorder');
        } catch (err) {
          console.error(err);
        }
    });

    if (this.earphoneDetection) this.startHelloLoop();
  }

  requestAssistant() {
    alert('관리자에게 도움을 요청했습니다.');
    // this.sendNotification();
  }
}
</script>

<style lang="scss" scoped>
.home {
  padding: 30px;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  .actions {
    display: flex;
    flex-direction: column;

    width: 100%;
    max-width: 600px;

    .action-item {
      display: flex;
      align-items: center;
      width: 100%;
      margin: 10px 0;

      .app-button {
        flex: 1;
        font-size: 2.2em;
        font-weight: bold;
        height: 100px;
        margin: 10px;
        border-radius: 16px;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        .iconify {
          font-size: 1.4em;
          margin-right: 15px;
        }
      }

      .voice-btn {
        flex: 0 0 100px;
        width: 100px;
        height: 100px;
        border-radius: 16px;
        background-color: #ff9800;
        color: white;
        font-size: 2em;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: background-color 0.2s, transform 0.1s;

        &:hover {
          background-color: #f57c00;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}
</style>
