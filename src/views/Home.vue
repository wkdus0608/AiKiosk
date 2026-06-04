<template>
  <div class="home">
    <div class="actions">
      <app-button @click="$router.replace('/voiceorder')">말로 주문하기</app-button>
      <app-button @click="requestAssistant">도움 요청</app-button>
      <app-button @click="$router.replace('order')">시작하기</app-button>
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

  @Mutation('activateEarphoneDetection') activateEarphoneDetection!: Function;

  @Action('startHelloLoop') startHelloLoop!: Function;
  @Action('playAudio', { namespace: 'AudioModule' }) playAudio!: Function;

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
    max-width: 500px;
    .app-button {
      font-size: 1.5em;
      height: 70px;
      margin: 15px;
    }
  }
}
</style>
