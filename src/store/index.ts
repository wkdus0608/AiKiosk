import { db } from '@/DB';
import { StockItem } from '@/schema';
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';

import { firestoreAction, vuexfireMutations } from 'vuexfire';

import axios from 'axios';
import CryptoJS from 'crypto-js';

import AudioModule from './modules/AudioModule';
import FirebaseModule from './modules/FirebaseModule';

const script = require('@/lib/script.json');

Vue.use(Vuex);

export interface RootState {
  isElectron: boolean;
  fcmToken: string;
  earphoneDetection: boolean;
  stockList: StockItem[];
  mockStockList: StockItem[];
  helloLoop: number;
  script: string;
  userText: string;
  fontSize: number;
  highContrast: boolean;
  showVoiceAssist: boolean;
}

const store: StoreOptions<RootState> = {
  state: {
    isElectron: process.env.IS_ELECTRON ? true : false,
    fcmToken: '',
    earphoneDetection: false,
    stockList: [],
    mockStockList: [
      {
        name: '아메리카노',
        price: 4500,
        quantity: 100,
        alias: ['아아', '따아', '커피'],
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80'
      },
      {
        name: '카페라떼',
        price: 5000,
        quantity: 100,
        alias: ['라떼'],
        image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&q=80'
      },
      {
        name: '카푸치노',
        price: 5000,
        quantity: 100,
        alias: ['거품커피'],
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&q=80'
      },
      {
        name: '바닐라라떼',
        price: 5500,
        quantity: 100,
        alias: ['바닐라', '단커피'],
        image: 'https://images.unsplash.com/photo-1461023058943-07fcaf183535?w=500&q=80'
      },
      {
        name: '조각 케이크',
        price: 6000,
        quantity: 20,
        alias: ['케익', '조각케익'],
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80'
      },
      {
        name: '초코 쿠키',
        price: 2000,
        quantity: 50,
        alias: ['쿠키'],
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80'
      },
      {
        name: '마카롱',
        price: 2500,
        quantity: 40,
        alias: ['마까롱'],
        image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=500&q=80'
      },
      {
        name: '크로플',
        price: 5500,
        quantity: 30,
        alias: ['와플'],
        image: 'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=500&q=80'
      },
      {
        name: '망고',
        price: 4500,
        quantity: 30,
        alias: ['망고', '망구'],
        image: 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=500&q=80'
      },
      {
        name: '수박',
        price: 5000,
        quantity: 20,
        alias: ['수박', '스박'],
        image: 'https://images.unsplash.com/photo-1563229871-841846ffb71a?w=500&q=80'
      },
      {
        name: '바나나',
        price: 1500,
        quantity: 50,
        alias: ['바나나'],
        image: 'https://images.unsplash.com/photo-1528825831135-3391d4c1ce3f?w=500&q=80'
      },
      {
        name: '레몬',
        price: 1000,
        quantity: 50,
        alias: ['레몬'],
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80'
      },
      {
        name: '자몽',
        price: 3000,
        quantity: 40,
        alias: ['자몽', '자뭉'],
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'
      },
      {
        name: '오렌지',
        price: 1000,
        quantity: 50,
        alias: ['오렌지'],
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&q=80'
      },
      {
        name: '사과',
        price: 1500,
        quantity: 60,
        alias: ['사과', '사가'],
        image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500&q=80'
      },
      {
        name: '토마토',
        price: 5000,
        quantity: 30,
        alias: ['토마토'],
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80'
      },
      {
        name: '복숭아',
        price: 3000,
        quantity: 30,
        alias: ['복숭아'],
        image: 'https://images.unsplash.com/photo-1522841799216-590ba63d748d?w=500&q=80'
      },
      {
        name: '체리',
        price: 500,
        quantity: 100,
        alias: ['체리'],
        image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=500&q=80'
      }
    ],
    helloLoop: 0,
    script: '',
    userText: '',
    fontSize: 1.0,
    highContrast: false,
    showVoiceAssist: false,
  },
  mutations: {
    activateEarphoneDetection(state) {
      state.earphoneDetection = true;
    },
    stopHelloLoop(state) {
      clearInterval(state.helloLoop);
    },
    setFontSize(state, size: number) {
      state.fontSize = size;
    },
    toggleHighContrast(state) {
      state.highContrast = !state.highContrast;
    },
    toggleVoiceAssist(state) {
      state.showVoiceAssist = !state.showVoiceAssist;
    },
    ...vuexfireMutations,
  },
  getters: {
    allStockList(state): StockItem[] {
      const merged = [...state.mockStockList];
      state.stockList.forEach(item => {
        if (!merged.find(m => m.name === item.name)) {
          merged.push(item);
        }
      });
      return merged;
    }
  },
  actions: {
    bindStock: firestoreAction(({ bindFirestoreRef }) => {
      return bindFirestoreRef('stockList', db.collection('stock').orderBy('name'));
    }),
    unbindStock: firestoreAction(({ unbindFirestoreRef }) => {
      unbindFirestoreRef('stockList');
    }),
    startHelloLoop({ state, dispatch }) {
      state.helloLoop = window.setInterval(
        () => dispatch('AudioModule/playAudio', { isLocal: true, data: 'home/hello' }),
        16000
      );
    },
    async playItems({ state, getters, dispatch }): Promise<boolean> {
      let stockList: string = '';
      getters.allStockList.forEach((item: StockItem) => {
        stockList += `${item.name}, `;
      });
      state.script = script.item_list;
      await dispatch('AudioModule/playAudio', { isLocal: true, data: 'voiceorder/item_list' });
      state.script = stockList;
      await dispatch('TTS', stockList);
      return true;
    },
    async STT({}, data: Blob): Promise<string> {
      return (
        await axios.post('https://naveropenapi.apigw.ntruss.com/recog/v1/stt', data, {
          params: {
            lang: 'Kor',
          },
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-NCP-APIGW-API-KEY-ID': process.env.VUE_APP_KEYID!,
            'X-NCP-APIGW-API-KEY': process.env.VUE_APP_KEY!,
          },
          withCredentials: true,
        })
      ).data.text;
    },
    async TTS({ dispatch }, text: string): Promise<any> {
      try {
        let checksum = CryptoJS.MD5(
          `3134${text}${process.env.VUE_APP_TTSACCOUNT}${process.env.VUE_APP_TTSID}${process.env.VUE_APP_TTSSECRET}`
        ).toString();

        let result: Blob = (
          await axios.get(
            `http://www.vocalware.com/tts/gen.php?EID=3&LID=13&VID=4&TXT=${text}&ACC=${process.env.VUE_APP_TTSACCOUNT}&API=${process.env.VUE_APP_TTSID}&CS=${checksum}`,
            {
              responseType: 'blob',
              headers: {
                'Content-Type': 'audio/mp3',
              },
            }
          )
        ).data;

        let url = URL.createObjectURL(result);
        return await dispatch('AudioModule/playAudio', { isLocal: false, data: url });
      } catch (err) {
        console.error(err);
      }
    },
  },
  modules: {
    AudioModule,
    FirebaseModule,
  },
};

export default new Vuex.Store(store);
