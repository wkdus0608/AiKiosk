<template>
  <div :class="{ order: !isElectron, 'order-electron': isElectron }">
    <div class="menu-section">
      <div class="category-tabs">
        <div v-for="(cat, catIdx) in categories" :key="cat" class="category-tab-wrapper">
          <button
            class="category-tab"
            :class="{ 
              active: selectedCategory === cat, 
              focused: currentZone === 'category' && currentIndex === catIdx 
            }"
            @click="selectedCategory = cat, currentZone = 'category', currentIndex = catIdx"
          >
            {{ cat }}
          </button>
          <button v-if="showVoiceAssist" class="voice-btn-small" @click.stop="TTS(cat)">
            <i class="iconify" data-icon="mdi:volume-high"></i>
          </button>
        </div>
      </div>

      <div class="product-container" ref="productContainer">
        <div 
          v-for="(item, idx) in filteredStockList" 
          :key="idx" 
          class="product-wrapper"
          :class="{ focused: currentZone === 'product' && currentIndex === idx }"
        >
          <div class="product" @click="addItem(item), currentZone = 'product', currentIndex = idx">
            <md-card md-with-hover>
              <md-ripple>
                <md-card-header v-if="!isElectron">
                  <img :src="item.image" />
                  <md-card-header-text>
                    <div class="md-title">{{ item.name }}</div>
                    <div class="md-subhead">{{ numberFormat(item.price) }}원</div>
                  </md-card-header-text>
                </md-card-header>
                <div v-else>
                  <md-card-media md-ratio="16:9">
                    <img :src="item.image" />
                  </md-card-media>
                  <md-card-header>
                    <div class="md-title">{{ item.name }}</div>
                    <div class="md-subhead">{{ numberFormat(item.price) }}원</div>
                  </md-card-header>
                </div>
              </md-ripple>
            </md-card>
          </div>
          <button v-if="showVoiceAssist" class="voice-btn-small item-voice-btn" @click.stop="TTS(`${item.name} ${item.price}원`)">
            <i class="iconify" data-icon="mdi:volume-high"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="shoppingCart-container">
      <transition name="fade">
        <app-button
          v-if="!shoppingCartVisible && shoppingCart.length && !isElectron"
          class="shoppingCart-toggle"
          round
          :class="{ focused: currentZone === 'cart-toggle' }"
          @click="shoppingCartVisible = true, currentZone = 'cart', currentIndex = 0"
        >
          <i class="iconify" data-icon="mdi:chevron-up"></i>
          장바구니 열기
        </app-button>
      </transition>

      <transition name="fade">
        <md-card
          class="shoppingCart"
          v-if="(shoppingCartVisible && shoppingCart.length) || isElectron"
        >
          <div class="shoppingCart-heading">
            <h1>장바구니</h1>
            <app-button 
              v-if="!isElectron" 
              round 
              :class="{ focused: currentZone === 'cart-hide' }"
              @click="shoppingCartVisible = false, currentZone = 'product', currentIndex = 0"
            >
              <i class="iconify" data-icon="mdi:chevron-down"></i>
              숨기기
            </app-button>
            <app-button
              v-else
              round
              color="accent"
              :disabled="!shoppingCart.length"
              :class="{ focused: currentZone === 'cart-clear' }"
              @click="shoppingCart.splice(0, shoppingCart.length)"
            >
              <i class="iconify" data-icon="mdi:trash"></i>
              비우기
            </app-button>
          </div>

          <div v-for="(item, idx) in shoppingCart" :key="idx" class="shoppingCart-item">
            <img :src="item.image" alt="" />
            <h2>{{ item.name }}</h2>

            <md-card-actions class="shoppingCart-actions">
              <app-button 
                circle dense 
                :class="{ focused: currentZone === 'cart' && currentIndex === idx * 2 }"
                @click="decreaseItem(item), currentZone = 'cart', currentIndex = idx * 2"
              >-</app-button>
              <h3>&times;{{ item.quantity }}</h3>
              <app-button 
                circle dense 
                :class="{ focused: currentZone === 'cart' && currentIndex === idx * 2 + 1 }"
                @click="increaseItem(item), currentZone = 'cart', currentIndex = idx * 2 + 1"
              >+</app-button>
            </md-card-actions>
            <h3 class="price">{{ numberFormat(item.price * item.quantity) }}원</h3>
          </div>

          <app-button
            class="checkout"
            round
            :disabled="!shoppingCart.length"
            :class="{ focused: currentZone === 'checkout' }"
            @click="(shoppingCartVisible = false), (isCheckoutVisible = true), currentZone = 'checkout'"
          >
            {{ getTotalPrice }}원 결제하기
          </app-button>
        </md-card>
      </transition>
    </div>

    <transition name="fade">
      <div v-if="isCheckoutVisible" class="checkout-container">
        <md-card class="checkout">
          <div class="checkout-heading">
            <h1>결제하기</h1>
            <app-button
              round
              color="accent"
              @click="(isCheckoutVisible = false), (shoppingCartVisible = true)"
            >
              <i class="iconify" data-icon="mdi:close"></i>
              취소하기
            </app-button>
          </div>
          <img src="/assets/images/credit_card.svg" alt="Credit Card" />

          <h2 class="total">
            {{ getTotalPrice }}원을 결제하려면
            {{ !isElectron ? '결제 수단을 선택해주세요.' : '카드를 삽입해주세요.' }}
          </h2>
        </md-card>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { StockItem } from '@/schema';
import numberFormat from '@/utils/numberFormat';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Action, State, Getter } from 'vuex-class';

@Component({})
export default class Order extends Vue {
  @State('isElectron') isElectron!: boolean;
  @Getter('allStockList') stockList!: StockItem[];
  @State('showVoiceAssist') showVoiceAssist!: boolean;

  @Action('TTS') TTS!: Function;

  categories: string[] = ['전체', '커피', '음료', '디저트'];
  selectedCategory: string = '전체';
  currentZone: string = 'category';
  currentIndex: number = 0;

  shoppingCartVisible: boolean = false;
  shoppingCart: StockItem[] = [];

  isCheckoutVisible: boolean = false;

  @Watch('selectedCategory')
  onCategoryChanged() {
    if (this.currentZone === 'product') this.currentIndex = 0;
  }

  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (this.isCheckoutVisible) {
      if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Enter') {
        this.isCheckoutVisible = false;
        this.shoppingCartVisible = true;
        this.currentZone = 'checkout';
      }
      return;
    }

    const products = this.filteredStockList;
    const cart = this.shoppingCart;
    const cols = this.isElectron ? 3 : 1;

    switch (event.key) {
      case 'ArrowRight':
        if (this.currentZone === 'category') {
          this.currentIndex = (this.currentIndex + 1) % this.categories.length;
          this.selectedCategory = this.categories[this.currentIndex];
        } else if (this.currentZone === 'product') {
          if ((this.currentIndex + 1) % cols === 0 || this.currentIndex === products.length - 1) {
            if (this.isElectron && cart.length > 0) {
              this.currentZone = 'cart-clear';
              this.currentIndex = 0;
            }
          } else {
            this.currentIndex = Math.min(this.currentIndex + 1, products.length - 1);
          }
        } else if (this.currentZone === 'cart') {
          if (this.currentIndex % 2 === 0) this.currentIndex++;
        }
        break;
      case 'ArrowLeft':
        if (this.currentZone === 'category') {
          this.currentIndex = (this.currentIndex - 1 + this.categories.length) % this.categories.length;
          this.selectedCategory = this.categories[this.currentIndex];
        } else if (this.currentZone === 'product') {
          if (this.currentIndex % cols !== 0) {
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
          }
        } else if (this.currentZone === 'cart' || this.currentZone === 'cart-clear' || this.currentZone === 'checkout') {
          if (this.currentZone === 'cart' && this.currentIndex % 2 === 1) {
            this.currentIndex--;
          } else if (this.isElectron) {
            this.currentZone = 'product';
            this.currentIndex = 0; // Or keep row
          }
        }
        break;
      case 'ArrowDown':
        if (this.currentZone === 'category') {
          this.currentZone = 'product';
          this.currentIndex = 0;
        } else if (this.currentZone === 'product') {
          if (this.currentIndex + cols < products.length) {
            this.currentIndex += cols;
          } else if (!this.isElectron && cart.length > 0) {
            this.currentZone = 'cart-toggle';
          }
        } else if (this.currentZone === 'cart-toggle') {
          this.currentZone = 'cart';
          this.currentIndex = 0;
        } else if (this.currentZone === 'cart-clear') {
          this.currentZone = 'cart';
          this.currentIndex = 0;
        } else if (this.currentZone === 'cart') {
          if (this.currentIndex + 2 < cart.length * 2) {
            this.currentIndex += 2;
          } else {
            this.currentZone = 'checkout';
          }
        }
        break;
      case 'ArrowUp':
        if (this.currentZone === 'product') {
          if (this.currentIndex - cols >= 0) {
            this.currentIndex -= cols;
          } else {
            this.currentZone = 'category';
            this.currentIndex = this.categories.indexOf(this.selectedCategory);
          }
        } else if (this.currentZone === 'cart') {
          if (this.currentIndex - 2 >= 0) {
            this.currentIndex -= 2;
          } else if (this.isElectron) {
            this.currentZone = 'cart-clear';
          } else {
            this.currentZone = 'cart-toggle';
          }
        } else if (this.currentZone === 'checkout') {
          if (cart.length > 0) {
            this.currentZone = 'cart';
            this.currentIndex = cart.length * 2 - 1;
          } else {
            this.currentZone = 'product';
            this.currentIndex = products.length - 1;
          }
        } else if (this.currentZone === 'cart-toggle' || this.currentZone === 'cart-clear') {
          this.currentZone = 'product';
          this.currentIndex = products.length - 1;
        }
        break;
      case 'Enter':
        this.handleEnter();
        break;
      case 'Tab':
        event.preventDefault();
        const catIdx = this.categories.indexOf(this.selectedCategory);
        this.selectedCategory = this.categories[(catIdx + 1) % this.categories.length];
        this.currentZone = 'category';
        this.currentIndex = (catIdx + 1) % this.categories.length;
        break;
    }
    this.scrollToFocused();
  }

  handleEnter() {
    const products = this.filteredStockList;
    const cart = this.shoppingCart;

    if (this.currentZone === 'category') {
      this.selectedCategory = this.categories[this.currentIndex];
    } else if (this.currentZone === 'product') {
      this.addItem(products[this.currentIndex]);
    } else if (this.currentZone === 'cart') {
      const itemIdx = Math.floor(this.currentIndex / 2);
      const isPlus = this.currentIndex % 2 === 1;
      if (isPlus) this.increaseItem(cart[itemIdx]);
      else this.decreaseItem(cart[itemIdx]);
    } else if (this.currentZone === 'checkout') {
      if (cart.length > 0) {
        this.shoppingCartVisible = false;
        this.isCheckoutVisible = true;
      }
    } else if (this.currentZone === 'cart-toggle') {
      this.shoppingCartVisible = true;
      this.currentZone = 'cart';
      this.currentIndex = 0;
    } else if (this.currentZone === 'cart-clear') {
      this.shoppingCart.splice(0, this.shoppingCart.length);
      this.currentZone = 'product';
      this.currentIndex = 0;
    }
  }

  scrollToFocused() {
    this.$nextTick(() => {
      const focusedElement = this.$el.querySelector('.focused') as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  getCategory(item: StockItem): string {
    const name = item.name.toLowerCase();
    
    // 커피 키워드
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
    
    // 디저트 키워드
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

  get filteredStockList(): StockItem[] {
    let list;
    if (this.selectedCategory === '전체') {
      list = this.stockList;
    } else {
      list = this.stockList.filter(item => this.getCategory(item) === this.selectedCategory);
    }
    // 카테고리 변경 시 포커스 초기화 방지 또는 리셋 로직
    return list;
  }

  numberFormat(number: number) {
    return numberFormat(number);
  }

  addItem(item: StockItem) {
    this.shoppingCartVisible = true;

    let prevItem = this.shoppingCart.find(s => s.name == item.name);
    // 이미 장바구니에 있을 시 개수 +1
    if (prevItem) {
      // 남은 재고량 확인 후 증감
      if (this.stockList.find(i => i.name == item.name)!.quantity > prevItem.quantity)
        prevItem.quantity++;
    } else this.shoppingCart.push({ ...item, quantity: 1 });
  }
  increaseItem(item: StockItem) {
    let prevItem = this.shoppingCart.find(i => i.name == item.name);
    if (this.stockList.find(i => i.name == item.name)!.quantity > prevItem!.quantity)
      prevItem!.quantity++;
  }
  decreaseItem(item: StockItem) {
    let prevItem = this.shoppingCart.find(i => i.name == item.name);
    if (prevItem!.quantity-- <= 1) this.removeItem(item);
  }
  removeItem(item: StockItem) {
    let prevItemIdx = this.shoppingCart.findIndex(i => i.name == item.name);
    if (prevItemIdx != -1) this.shoppingCart.splice(prevItemIdx, 1);
  }

  get getTotalPrice(): string {
    return numberFormat(
      this.shoppingCart.reduce(
        (total: number, cartItem: StockItem) => total + cartItem.price * cartItem.quantity,
        0
      )
    );
  }
}
</script>

<style lang="scss" scoped>
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

.order {
  display: flex;
  flex-direction: column;

  height: 100%;

  .menu-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .category-tabs {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    background-color: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 20px;
    gap: 15px;

    .category-tab-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 200px;
      justify-content: center;

      .category-tab {
        flex: 1;
        width: 100%;
        height: 50px;
        font-size: 1.25em;
        font-weight: bold;
        border: 1px solid #cccccc;
        background-color: #ffffff;
        color: #333333;
        border-radius: 25px;
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

        &.focused {
          background-color: #f0f0f0;
          color: #333333;
          outline: 4px solid #ff9800;
          outline-offset: -4px;
          z-index: 10;
        }

        &.active.focused {
          background-color: #2c2b39;
          color: #ffffff;
        }
      }
    }
  }

  .voice-btn-small {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #ff9800;
    color: white;
    font-size: 1.25em;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: none;
    outline: none;
    transition: background-color 0.2s, transform 0.1s;
    z-index: 100;

    &:hover {
      background-color: #f57c00;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .product-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    overflow-y: scroll;
    flex: 1;

    .product-wrapper {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 15px;
      transition: all 0.2s ease;
      border-radius: 10px;

      &.focused {
        background-color: rgba(255, 152, 0, 0.1);
        transform: scale(1.02);
        outline: 4px solid #ff9800;
        outline-offset: -4px;
        z-index: 10;
      }

      .product {
        flex: 1;
        .md-ripple {
          height: 90px;
          img {
            width: 60px;
            height: 60px;
          }
          .md-title {
            margin: 0;
          }
          .md-card-header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      }

      .item-voice-btn {
        margin-left: 10px;
      }
    }
  }
  .shoppingCart-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    margin: 0 auto;
    margin-bottom: 15px;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 60%;
    min-width: 400px;

    z-index: 10000;

    .shoppingCart-toggle {
      padding: 10px;
    }
    .shoppingCart {
      display: flex;
      flex-direction: column;
      align-items: center;

      border-radius: 20px;

      width: 100%;
      max-width: 500px;

      padding: 20px;

      box-shadow: 0 3px 5px -1px rgba(#000, 0.5);

      .shoppingCart-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;

        width: 100%;
        margin-bottom: 10px;
      }

      .shoppingCart-item {
        display: flex;
        align-items: center;

        width: 100%;

        padding: 10px 0;
        border-bottom: 0.5px solid rgba(#000, 0.15);

        h2 {
          padding: 0 4px;
        }
        img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }
      }

      h2 {
        flex: 2;
      }
      .shoppingCart-actions {
        flex: 1;
        .md-icon-button {
        }
        h3 {
          padding: 0 10px;
        }
      }
      .price {
        flex: 2;
        text-align: right;
      }
      .checkout {
        margin-top: 20px;
        align-self: flex-end;
      }
    }
  }
}

.order-electron {
  display: flex;
  height: 100%;

  .menu-section {
    display: flex;
    flex-direction: column;
    width: 70%;
    height: 100%;
    box-shadow: 1px 0 40px rgba(#000, 0.1);

    .category-tabs {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      background-color: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 15px 40px;
      gap: 20px;

      .category-tab-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        max-width: 250px;
        justify-content: center;

        .category-tab {
          flex: 1;
          width: 100%;
          height: 60px;
          font-size: 1.5em;
          font-weight: bold;
          border: 1px solid #cccccc;
          background-color: #ffffff;
          color: #333333;
          border-radius: 30px;
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
  }

  .product-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;

    row-gap: 30px;
    column-gap: 30px;

    width: 100%;

    padding: 40px;

    overflow-y: scroll;
    flex: 1;

    .product-wrapper {
      display: flex;
      align-items: center;
      width: 100%;

      .product {
        flex: 1;
      }

      .item-voice-btn {
        margin-left: 10px;
      }
    }
  }

  .shoppingCart-container {
    display: flex;
    flex-direction: column;

    position: relative;

    width: 30%;
    height: 100%;

    padding: 30px;

    .shoppingCart {
      box-shadow: none;
      background-color: transparent;
      margin-top: 20px;

      height: 100%;

      .shoppingCart-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;

        margin-bottom: 40px;
        h1 {
          font-size: 2.5em;
        }
      }

      .shoppingCart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 20px 0;
        border-bottom: 0.5px solid rgba(#000, 0.15);

        img {
          width: 50px;
          height: 50px;

          border-radius: 50%;
        }

        h3 {
          padding: 0 10px;
        }
      }

      .checkout {
        position: absolute;
        top: auto;
        bottom: 10px;

        width: 100%;
        height: 50px;
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

.app-button.focused {
  outline: 4px solid #ff9800 !important;
  outline-offset: -4px;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5) !important;
}

@media screen and (max-width: 600px) {
  .shoppingCart-container {
    .shoppingCart-actions {
      .md-icon-button {
        // display: none;
      }
    }
    .price {
      flex: 3 !important;
    }
  }
}
</style>
