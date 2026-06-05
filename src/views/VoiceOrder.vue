<template>
  <div class="voiceorder">
    <div class="menu-list-container">
      <div class="menu-list-header">
        <i class="iconify" data-icon="mdi:list-box-outline"></i>
        주문 가능한 메뉴
      </div>
      <div class="menu-list">
        <div v-for="(items, category) in categorizedStock" :key="category" class="category-group">
          <div class="category-name">{{ category }}</div>
          <div v-for="item in items" :key="item.name" class="menu-list-item">
            <img :src="item.image" :alt="item.name" />
            <div class="menu-info">
              <span class="menu-name">{{ item.name }}</span>
              <span class="menu-price">{{ numberFormat(item.price) }}원</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="order-main">
      <div class="dialog">
        <div class="speech">
          <app-button circle color="default">
            <i class="iconify" data-icon="mdi:volume-high"></i>
          </app-button>
          {{ script }}
        </div>
        <div v-if="userText" class="userText">
          <app-button circle color="default">
            <i class="iconify" data-icon="mdi:microphone"></i>
          </app-button>
          {{ userText }}
        </div>
      </div>

      <div class="indicator" :class="{ speakable: isSpeakable, recording: isRecording }">
        <span v-if="isSpeakable || isRecording">
          <span> <i class="iconify" data-icon="mdi:microphone"></i></span>
        </span>
        <span v-else>
          <span> <i class="iconify" data-icon="mdi:microphone-off"></i></span>
        </span>
      </div>

      <div class="shoppingCart-container">
        <transition name="fade">
          <md-card class="shoppingCart" v-if="shoppingCart.length">
            <div class="shoppingCart-heading">
              <h1>장바구니</h1>
            </div>

            <div v-for="(item, idx) in shoppingCart" :key="idx" class="shoppingCart-item">
              <img :src="item.image" alt="" />
              <h2>{{ item.name }}</h2>
              <h3>&times;{{ item.quantity }}</h3>

              <h3 class="price">{{ numberFormat(item.price * item.quantity) }}원</h3>
            </div>

            <h2 class="total">합계 | {{ getTotalPrice }}원</h2>
          </md-card>
        </transition>
      </div>
    </div>

    <transition name="fade">
      <div v-if="isCheckoutVisible" class="checkout-container">
        <md-card class="checkout">
          <div class="checkout-heading">
            <h1>결제하기</h1>
            <app-button round color="accent" @click="isCheckoutVisible = false">
              <i class="iconify" data-icon="mdi:close"></i>
              취소하기
            </app-button>
          </div>
          <img src="/assets/images/credit_card.svg" alt="Credit Card" />

          <h2 class="total">{{ getTotalPrice }}원을 결제하려면 카드를 삽입해주세요.</h2>
        </md-card>
      </div>
    </transition>

    <STT v-model="isRecording" :callback="parseText" />
  </div>
</template>

<script lang="ts">
import STT from '@/components/util/STT.vue';
import { StockItem } from '@/schema';
import numberFormat from '@/utils/numberFormat';
import { Component, Vue } from 'vue-property-decorator';
import { Action, State, Getter } from 'vuex-class';

const script = require('@/lib/script.json');
const koreanNumber = require('@/lib/koreanNumber.json');

@Component({
  components: {
    STT,
  },
})
export default class VoiceOrder extends Vue {
  @Getter('allStockList') stockList!: StockItem[];
  @State('script') script!: string;
  @State('userText') userText!: string;

  @Action('playAudio', { namespace: 'AudioModule' }) playAudio!: Function;
  @Action('playItems') playItems!: Function;
  @Action('TTS') TTS!: Function;

  isRecording: boolean = false;
  isSpeakable: boolean = false;
  isOrderProcess: boolean = false;

  isCheckoutVisible: boolean = false;

  shoppingCart: StockItem[] = []; // 현 주문 상품

  get categorizedStock(): { [key: string]: StockItem[] } {
    const groups: { [key: string]: StockItem[] } = {
      '커피': [],
      '음료': [],
      '디저트': []
    };

    this.stockList.forEach(item => {
      const category = this.getCategory(item);
      if (groups[category]) {
        groups[category].push(item);
      } else {
        groups['음료'].push(item); // Default
      }
    });

    // Remove empty categories
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }

  getCategory(item: StockItem): string {
    const name = item.name.toLowerCase();
    
    if (
      name.includes('커피') || 
      name.includes('에스프레소') || 
      name.includes('아메리카노') || 
      name.includes('라떼') || 
      name.includes('콜드브루') || 
      name.includes('모카') || 
      name.includes('카푸치노') || 
      name.includes('마끼아또')
    ) {
      if (
        name.includes('말차라떼') || 
        name.includes('초코') || 
        name.includes('딸기라떼') || 
        name.includes('티라떼') || 
        name.includes('밀크티') ||
        name.includes('곡물라떼') ||
        name.includes('토피넛라떼')
      ) {
        return '음료';
      }
      return '커피';
    }
    
    if (
      name.includes('케이크') || 
      name.includes('쿠키') || 
      name.includes('브레드') || 
      name.includes('마카롱') || 
      name.includes('머핀') || 
      name.includes('와플') || 
      name.includes('빵') || 
      name.includes('베이글') || 
      name.includes('샌드위치') || 
      name.includes('허니') ||
      name.includes('아이스크림') ||
      name.includes('팥빙수') ||
      name.includes('빙수') ||
      name.includes('허니브레드') ||
      name.includes('번') ||
      name.includes('크로플')
    ) {
      return '디저트';
    }
    
    return '음료';
  }

  async mounted() {
    window.addEventListener('keydown', this.activatePTT);
    window.addEventListener('keyup', this.deactivatePTT);

    this.$store.state.script = script.earphone_connected;
    await this.playAudio({ isLocal: true, data: 'voiceorder/earphone_connected' });
    await this.playItems();
    this.isOrderProcess = true;
    this.orderProcess();

    // setTimeout(() => {
    // 	this.shoppingCart.push(
    // 		{
    // 			name: "망고",
    // 			price: 4000,
    // 			quantity: 2,
    // 			image: "https://firebasestorage.googleapis.com/v0/b/interactive-kiosk.appspot.com/o/products%2Fmango.jpg?alt=media&token=657b4a4a-0be6-4a45-8104-8659daf86edc",
    // 		},
    // 		{
    // 			name: "자몽",
    // 			price: 3000,
    // 			quantity: 5,
    // 			image: "https://firebasestorage.googleapis.com/v0/b/interactive-kiosk.appspot.com/o/products%2Fgrapefruit.jpg?alt=media&token=8f451da3-be70-4100-b94b-7f8514197087",
    // 		}
    // 	);
    // }, 500);
  }

  numberFormat(number: number) {
    return numberFormat(number);
  }

  get getTotalPrice(): string {
    let total = 0;
    this.shoppingCart.forEach(i => {
      total += i.price * i.quantity;
    });
    return numberFormat(total);
  }

  activatePTT(event: KeyboardEvent) {
    if (event.code !== 'Space' || this.isRecording || !this.isSpeakable || !this.isOrderProcess)
      return;
    this.isRecording = true;
    this.isSpeakable = false;
    this.playAudio({ isLocal: true, data: 'voiceorder/ptt_activate' });
  }

  deactivatePTT(event: KeyboardEvent) {
    if (event.code !== 'Space' || !this.isRecording || !this.isOrderProcess) return;
    setTimeout(() => {
      this.isRecording = this.isSpeakable = false;
    }, 1000);
    this.playAudio({ isLocal: true, data: 'voiceorder/ptt_deactivate' });
  }

  async orderProcess() {
    if (this.isOrderProcess) {
      if (!this.shoppingCart.length) {
        this.$store.state.script = script.ask;
        await this.playAudio({ isLocal: true, data: 'voiceorder/ask' });
      } else {
        this.$store.state.script = script.ask_another;
        await this.playAudio({ isLocal: true, data: 'voiceorder/ask_another' });
      }
      this.isSpeakable = true;
    }
  }

  async parseText(text: string) {
    let unavailableItems: StockItem[] = []; // 주문 불가능한 상품

    this.isSpeakable = false;

    if (text === '완료' || text === '종료' || text === '만료') return this.checkout();

    try {
      let split = text.split(new RegExp('(,| )')).filter(data => data.trim() && data.trim() != ',');
      console.log(split);
      let processedAny = false;

      for (let i = 0; i < split.length; i++) {
        let word = split[i];
        let nextWord = split[i + 1];

        let wordMatch = word?.match(
          new RegExp(
            `(${this.stockList
              .map(item => [item.name, ...(item.alias || [])])
              .flat()
              .filter(name => name)
              .join('|')})`
          )
        );

        let stockItem: StockItem | undefined;

        if (wordMatch) {
          let matchedName = wordMatch[0];
          // 인덱스 가져오기
          stockItem = this.stockList.find(
            item =>
              (item.alias && item.alias.indexOf(matchedName) != -1) || item.name == matchedName
          );
          if (!stockItem) continue;
        } else continue;

        let nextWordMatch = nextWord?.match(
          new RegExp(
            `([1-9]+[0-9]*)|(열|스물|서른|마흔|쉰|예순|일흔|여든|아흔)(하나|둘|셋|다섯|여섯|일곱|여덟|아홉)?|(스무)|(한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉)`
          )
        );

        let quantity = 1;

        if (nextWordMatch) {
          i++;
          // 갯수 가져오기
          let matchCount = String(nextWordMatch[0]);
          if (!isNaN(Number(matchCount))) quantity = Number(matchCount);
          else if (matchCount in koreanNumber) quantity = koreanNumber[matchCount];
        }

        let prevStockItem = this.shoppingCart.find(s => s.name == stockItem?.name);
        if (prevStockItem) {
          if (stockItem!.quantity >= prevStockItem.quantity + quantity) {
            prevStockItem.quantity += quantity;
            processedAny = true;
          } else unavailableItems.push(stockItem!);
        } else {
          if (stockItem!.quantity >= quantity) {
            this.shoppingCart.push({ ...stockItem!, quantity: quantity });
            processedAny = true;
          } else unavailableItems.push(stockItem!);
        }
      }

      if (!processedAny && !unavailableItems.length) throw '인식된 메뉴가 없습니다.';

      let clearStr = '장바구니에 담긴 제품';
      if (!this.shoppingCart.length) {
        clearStr += '이 없';
        if (unavailableItems.length)
          clearStr += `으며, 주문 불가능한 제품은 ${unavailableItems
            .map(s => s.name)
            .join(',')}입니다.`;
        else clearStr += '습니다.';
      } else {
        clearStr += `은 ${this.shoppingCart.map(item => item.name).join(',')}`;
        if (unavailableItems.length)
          clearStr += `이며, 주문 불가능한 제품은 ${unavailableItems
            .map(s => s.name)
            .join(',')}입니다.`;
        else clearStr += '입니다.';
      }

      this.$store.state.script = clearStr;
      await this.TTS(clearStr);
    } catch (err) {
      console.error(err);
      this.$store.state.script = script.error;
      await this.playAudio({ isLocal: true, data: 'voiceorder/error' });
    }
    this.orderProcess();
  }

  async checkout() {
    this.isRecording = false;
    this.isSpeakable = false;
    this.isOrderProcess = false;

    this.isCheckoutVisible = true;

    this.$store.state.script = script.checkout_complete;
    await this.playAudio({ isLocal: true, data: 'voiceorder/checkout_complete' });
  }
}
</script>

<style lang="scss" scoped>
@import '../variables';

@keyframes indicator {
  0% {
    box-shadow: 2px 2px 10px rgba(#000, 0.4);
  }
  50% {
    box-shadow: 3px 3px 20px rgba(#000, 0.7);
  }
  100% {
    box-shadow: 2px 2px 10px rgba(#000, 0.4);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.3s;
  position: absolute;
  bottom: 0;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(100px);
}

.voiceorder {
  display: flex;
  flex-direction: row; // Changed from column to row
  justify-content: space-between;
  align-items: stretch;

  width: 100%;
  height: 100%;

  overflow: hidden;

  .menu-list-container {
    width: 30%;
    min-width: 300px;
    height: 100%;
    background-color: #f5f5f5;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;

    .menu-list-header {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #333;

      .iconify {
        font-size: 1.2em;
        color: $primary-color;
      }
    }

    .menu-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 25px; // Increased gap between categories

      .category-group {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .category-name {
          font-size: 1.2em;
          font-weight: bold;
          color: $primary-color;
          padding-bottom: 5px;
          border-bottom: 2px solid rgba($primary-color, 0.2);
          margin-bottom: 5px;
        }
      }

      .menu-list-item {
        display: flex;
        align-items: center;
        background-color: white;
        padding: 10px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

        img {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 12px;
        }

        .menu-info {
          display: flex;
          flex-direction: column;

          .menu-name {
            font-size: 1.1em;
            font-weight: 600;
            color: #333;
          }

          .menu-price {
            font-size: 0.9em;
            color: #666;
          }
        }
      }
    }
  }

  .order-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    background-color: white;

    .dialog {
      position: absolute;
      top: 60px; // Adjusted from 120px

      padding: 20px;

      border-radius: 20px;

      background-color: white;
      box-shadow: 0 3px 5px rgba(#000, 0.4);

      font-weight: 500;
      font-size: 1.4em;

      max-width: 80%;

      .speech,
      .userText {
        display: flex;
        align-items: center;
      }

      .userText {
        padding-top: 15px;
        margin-top: 15px;
        border-top: 1px solid rgba(#000, 0.3);
      }

      .app-button {
        margin-right: 15px;
        .iconify {
          font-size: 2em;
        }
      }
    }

    .indicator {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 200px;
      height: 200px;

      border-radius: 50%;
      background-color: rgba(#000, 0.3);
      box-shadow: 0 2px 10px rgba(#000, 0.4);

      font-size: 80px;
      color: white;

      &.speakable {
        animation: indicator 1.5s infinite;
        background-color: $primary-color;
      }

      &.recording {
        background-color: #47cf73;
      }
    }

    .shoppingCart-container {
      position: absolute; // Changed from fixed
      bottom: 20px;
      left: 0;
      right: 0;

      margin: 0 auto;

      display: flex;
      justify-content: center;
      align-items: center;

      width: 80%;

      z-index: 10000;

      .shoppingCart {
        display: flex;
        flex-direction: column;
        align-items: center;

        border-radius: 20px;

        width: 100%;
        max-width: 500px;

        padding: 20px;

        box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);

        .shoppingCart-heading {
          display: flex;
          align-items: center;

          width: 100%;
          margin-bottom: 10px;
        }

        .shoppingCart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;

          width: 100%;

          padding: 10px 0;
          border-bottom: 0.5px solid rgba(#000, 0.15);

          h2 {
            flex: 1;
            padding: 0 4px;
            font-size: 1.2em;
          }
          img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
          }
        }
        .price {
          flex: 1;
          text-align: right;
        }
        .total {
          margin-top: 20px;
          align-self: flex-end;
          font-weight: bold;
        }
      }
    }
  }
}

.checkout-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;
  align-items: flex-end;

  background-color: rgba(#000, 0.5);

  width: 100%;
  height: 100%;

  z-index: 10001;

  .checkout {
    display: flex;
    flex-direction: column;
    align-items: center;

    border-radius: 20px;

    margin-bottom: 15px;

    width: 100%;
    max-width: 500px;

    padding: 20px;

    box-shadow: 0 3px 5px -1px rgba(#000, 0.5);

    .checkout-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;

      width: 100%;
      margin-bottom: 10px;
    }

    img {
      display: block;

      width: calc(50% - 32px);
      max-height: 370px;
    }

    .total {
      margin-top: 20px;
    }
  }
}
</style>
