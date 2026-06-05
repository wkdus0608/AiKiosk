<template>
  <div id="app" :style="{ '--font-scale': fontSize }" :class="{ 'high-contrast': highContrast }">
    <header>
      <div class="pwa">
        <app-button v-if="deferredPrompt" circle color="default" @click="showPWA">
          <i class="iconify" data-icon="mdi:download"></i>
        </app-button>
      </div>
      <div class="title">
        <i data-icon="mdi-account-voice" class="iconify" />
        Interactive Kiosk
      </div>
      <div class="admin" @dblclick="$router.replace('/admin')"></div>
    </header>

    <div class="accessibility-toolbar">
      <div class="toolbar-section">
        <span class="toolbar-label">
          <i class="iconify" data-icon="mdi:format-size"></i>
          글자 크기:
        </span>
        <button class="toolbar-btn" :class="{ active: fontSize === 1.0 }" @click="setFontSize(1.0)">보통</button>
        <button class="toolbar-btn" :class="{ active: fontSize === 1.3 }" @click="setFontSize(1.3)">크게</button>
        <button class="toolbar-btn" :class="{ active: fontSize === 1.6 }" @click="setFontSize(1.6)">아주 크게</button>
      </div>
      <div class="toolbar-section">
        <span class="toolbar-label">
          <i class="iconify" data-icon="mdi:theme-light-dark"></i>
          고대비 화면:
        </span>
        <button class="toolbar-btn" :class="{ active: highContrast }" @click="toggleHighContrast">
          {{ highContrast ? '켜짐' : '꺼짐' }}
        </button>
      </div>
      <div class="toolbar-section">
        <span class="toolbar-label">
          <i class="iconify" data-icon="mdi:volume-high"></i>
          음성 안내 버튼:
        </span>
        <button class="toolbar-btn" :class="{ active: showVoiceAssist }" @click="toggleVoiceAssist">
          {{ showVoiceAssist ? '표시됨' : '숨김' }}
        </button>
      </div>
    </div>

    <div class="path-list">
      <router-link to="/" class="path">
        <i class="iconify path" data-icon="mdi-home" @click="$router.replace('/')"></i>
      </router-link>
      <span class="path">{{ $route.name }}</span>
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Action, Mutation, State } from 'vuex-class';

@Component({})
export default class App extends Vue {
  @State('fontSize') fontSize!: number;
  @State('highContrast') highContrast!: boolean;
  @State('showVoiceAssist') showVoiceAssist!: boolean;

  @Mutation('setFontSize') setFontSize!: Function;
  @Mutation('toggleHighContrast') toggleHighContrast!: Function;
  @Mutation('toggleVoiceAssist') toggleVoiceAssist!: Function;

  @Action('bindStock') bindStock!: Function;
  @Mutation('stopAudio', { namespace: 'AudioModule' }) stopAudio!: Function;
  @Mutation('stopHelloLoop') stopHelloLoop!: Function;

  @Watch('$route')
  onRouteChange() {
    this.stopAudio();
    this.stopHelloLoop();
  }

  deferredPrompt: any = false;

  async mounted() {
    await this.bindStock();
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('installed');
      e.prompt();
    });
  }

  showPWA() {
    this.deferredPrompt.prompt();
  }

  get isMac() {
    return process.platform === 'darwin';
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;

  box-sizing: border-box;
}

button {
  border: none;
}
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-thumb:window-inactive,
::-webkit-scrollbar-thumb {
  width: 5px;
  height: 5px;
  background-color: #cccccc;
}
::-webkit-scrollbar-track {
  width: 5px;
  height: 5px;
  background-color: #dddddd;
}

html {
  -webkit-user-select: none;
  user-select: none;
  word-break: keep-all;

  background-color: #eeeeee;
}
#app {
  --font-scale: 1.0;
  font-size: calc(16px * var(--font-scale));

  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    background-color: #1c1b29;

    font-size: 2em;
    text-align: center;
    color: white;

    -webkit-user-select: none;
    -webkit-app-region: drag;

    .pwa {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 60px;
      height: 60px;

      .app-button {
        font-size: 1.25em;

        z-index: 10000;
      }
    }

    .title {
      font-weight: bold;

      .iconify {
        margin-right: 10px;
      }
    }

    .admin {
      width: 60px;
      height: 60px;

      cursor: move;
    }
  }

  .accessibility-toolbar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
    padding: 10px 24px;
    background-color: #f7f7f9;
    border-bottom: 1px solid #e1e4e8;
    gap: 12px;

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 8px;

      .toolbar-label {
        font-size: 1.1em;
        font-weight: bold;
        color: #333333;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .toolbar-btn {
        padding: 8px 16px;
        font-size: 1em;
        font-weight: bold;
        border: 1px solid #cccccc;
        background-color: #ffffff;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #f0f0f0;
        }

        &.active {
          background-color: #1c1b29;
          color: #ffffff;
          border-color: #1c1b29;
        }
      }
    }
  }

  .content {
    flex: 1;

    overflow-y: hidden;
  }

  .path-list {
    display: flex;
    align-items: center;

    padding: 4px 24px;

    background-color: rgba(#1c1b29, 0.8) !important;

    color: rgba(#fff, 0.65);
    font-size: 1em;

    .iconify {
    }

    .path {
      display: flex;
      align-items: center;
      color: rgba(#fff, 0.65);

      cursor: pointer;

      &:not(:first-child)::before {
        content: '＞';

        margin: 0 8px;

        font-size: 0.75em;
      }

      &:hover {
        color: #fff;
      }
    }
  }

  // High contrast rules
  &.high-contrast {
    background-color: #000000 !important;
    color: #ffffff !important;

    header {
      background-color: #000000 !important;
      border-bottom: 2px solid #ffff00;
    }

    .path-list {
      background-color: #111111 !important;
      border-bottom: 1px solid #ffff00;
      .path {
        color: #ffffff !important;
        &:hover {
          color: #ffff00 !important;
        }
      }
    }

    .accessibility-toolbar {
      background-color: #111111 !important;
      border-bottom: 1px solid #ffff00;
      .toolbar-label {
        color: #ffffff !important;
      }
      .toolbar-btn {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: 2px solid #ffffff !important;
        &.active {
          background-color: #ffff00 !important;
          color: #000000 !important;
          border-color: #ffff00 !important;
        }
      }
    }

    // Vue material elements overrides for high contrast
    .md-card {
      background-color: #000000 !important;
      border: 2px solid #ffffff !important;
      color: #ffffff !important;
      
      .md-title {
        color: #ffffff !important;
      }
      .md-subhead {
        color: #ffff00 !important;
      }
    }

    .app-button, button.md-button {
      background-color: #000000 !important;
      color: #ffff00 !important;
      border: 3px solid #ffff00 !important;
      font-weight: 900 !important;

      &.md-accent {
        border-color: #ff5555 !important;
        color: #ff5555 !important;
      }
      
      &.active {
        background-color: #ffff00 !important;
        color: #000000 !important;
      }
      
      &:disabled {
        border-color: #555555 !important;
        color: #555555 !important;
        background-color: #222222 !important;
      }
    }
    
    // Dialog / Speech overrides
    .dialog {
      background-color: #000000 !important;
      border: 2px solid #ffffff !important;
      color: #ffffff !important;
      .speech, .userText {
        color: #ffffff !important;
      }
    }

    .voiceorder {
      background-color: #000000 !important;
      .indicator {
        background-color: #222222 !important;
        border: 4px solid #ffffff !important;
        &.speakable {
          background-color: #000000 !important;
          border-color: #ffff00 !important;
          color: #ffff00 !important;
        }
        &.recording {
          background-color: #ffff00 !important;
          color: #000000 !important;
          border-color: #ffff00 !important;
        }
      }
    }

    // Shopping cart item overrides
    .shoppingCart-item {
      border-bottom-color: #ffff00 !important;
      h2, h3 {
        color: #ffffff !important;
      }
      .price {
        color: #ffff00 !important;
      }
    }

    // Voice assist button overrides
    .voice-btn, .voice-btn-small {
      background-color: #000000 !important;
      color: #ffff00 !important;
      border: 3px solid #ffff00 !important;
    }

    // Category tabs overrides
    .category-tabs {
      background-color: #000000 !important;
      border-bottom: 2px solid #ffff00 !important;
      .category-tab {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: 2px solid #ffffff !important;
        &.active {
          background-color: #ffff00 !important;
          color: #000000 !important;
          border-color: #ffff00 !important;
        }
      }
    }
  }
}
</style>
