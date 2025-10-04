<template>
  <div class="finance-page">

    <!-- 动态理财板块 -->
    <div class="card">
      <div class="dynamic-title">
        <span>📊 动态理财</span>
        <span class="detail" @click="goDynamicDetail">查看详情</span>
      </div>
      <div class="gold-divider"></div>

      <!-- 动态产品列表 -->
      <div class="product-list-wrapper">
        <div class="product-list">
          <div class="product" v-for="(item, i) in dynamicList" :key="i">
            <img src="@/assets/动态理财.gif" alt="动态理财" />


                <div class="info grid2x2">
                  <!-- 第1行 -->
                  <span class="cell name">{{ item.name }}</span>
                  <span class="cell price">{{ item.price }} USDT</span>
                  <!-- 第2行 -->
                  <span class="cell cycleDays">{{ item.cycleDays }}小时</span>
                  <span class="cell yieldRate">利率:{{ (item.yieldRate * 100 - 100).toFixed(2) }}%</span>
                </div>


            <button class="buy-btn" @click="buyProductItem(item.id, 'dynamic')">购买</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 静态理财板块 -->
    <div class="card">
      <div class="static-title">
        <span>📊 静态理财</span>
        <span class="detail" @click="goStaticDetail">查看详情</span>
      </div>
      <div class="gold-divider"></div>

      <!-- 静态产品列表 -->
      <div class="product-list-wrapper">
        <div class="product-list">
          <div class="product" v-for="(item, i) in staticList" :key="i">
            <img src="@/assets/静态理财.gif" alt="静态理财" />

                <div class="info grid2x2">
                  <!-- 第1行 -->
                  <span class="cell name">{{ item.name }}</span>
                  <span class="cell price">{{ item.price }} USDT</span>
                  <!-- 第2行 -->
                  <span class="cell cycleDays">{{ item.cycleDays }}天</span>
                  <span class="cell yieldRate">利率:{{ (item.yieldRate * 100 - 100).toFixed(2) }}%</span>
                </div>


            <button class="buy-btn" @click="buyProductItem(item.id, 'static')">购买</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 作为“弹窗+状态机”使用：隐藏其内置输入 -->
    <PaymentWidget
      ref="payRef"
      :show-balance="true"
      :show-list="true"
      :show-builtin-input="false"
      :WalletTP="WalletTP"
      :RequestOrder="stySell"
      :SubmitOrder="SubmitOrder"
      @done="onPayDone"
      @close="onPayClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import router from '@/router'
import { getProductAllStatic, getProductAllSynamic, buyProduct, stySell } from '@/utils/api'
import CallbackCenter from "@/utils/callbackCenter";
import WalletTP from '@/utils/walletTP.js'
import { SubmitOrder } from '@/utils/api.js'
import PaymentWidget from '@/components/STTT/PaymentWidget.vue'

const dynamicList = ref([])
const staticList = ref([])
const payRef = ref(null)
const ready = ref(false)

async function getSynamic() {
  try {
    let res = await getProductAllSynamic()
    if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
      dynamicList.value = res.data.data
    }
  } catch (e) {
    console.error("获取动态理财失败:", e)
  }
}

async function getStatic() {
  try {
    let res = await getProductAllStatic()
    if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
      staticList.value = res.data.data
    }
  } catch (e) {
    console.error("获取静态理财失败:", e)
  }
}

async function buyProductItem(id, type) {
  CallbackCenter.trigger('openTwoPasswordDialog', async (pwdMd5) => {
    try {
      let _productType = type === "static" ? 0 : 1
      const res = await buyProduct({ productType: _productType, twoPassword: pwdMd5, productId: id })
      const body = res?.data
      if (body?.code === 200) {
        alert(body.message)
      } else {
        alert(body?.message || '购买失败')
      }
    } catch (e) {
      console.error('购买异常:', e)
      alert(e.message || '购买异常')
    }
  })
}

function goDynamicDetail() { router.push("/dynamic") }
function goStaticDetail() { router.push("/statuc") }

function onPayDone(res) { console.log('done', res) }
function onPayClose() { console.log('close') }

onMounted(() => {
  getSynamic()
  getStatic()
  ready.value = true
})
</script>
<style>
.finance-page {
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  font-family: "Microsoft YaHei", sans-serif;
  position: relative;
  overflow: hidden;
}

/* 金色聚光灯背景 */
.finance-page::before {
  content: "";
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%) scaleY(0.55);
  width: 100%;
  height: 200%;
  background: radial-gradient(ellipse at 50% 0%,
      rgba(255, 215, 0, 0.6) 0%,
      rgba(255, 193, 7, 0.35) 35%,
      rgba(0, 0, 0, 0.95) 100%);
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}

/* 白色卡片 */
.card {
  background: #fff;
  padding: 18px;
  margin: 14px 0;
  width: 90%;
  max-width: 420px;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  margin-top: 30px;
}

.dynamic-title,
.static-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-title .detail,
.static-title .detail {
  margin-left: auto;
}

.gold-divider {
  height: 1px;
  width: 100%;
  margin: 10px 0 14px;
  background-color: #ffed84;
  border-radius: 1px;
}

.detail {
  font-size: 13px;
  font-weight: bold;
  color: #f6c244;
  text-decoration: none;
  cursor: pointer;
  transition: 0.25s;
}

.detail:hover {
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
}

/* 动静理财切换 */
.sty-btn {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 12px 0;
}

.sty-btn button {
  flex: none;
  min-width: 90px;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #ddd;
  background: #f9f9f9;
  color: #555;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.25s;
}

/* 激活状态 */
.sty-btn button.active {
  background: #fffbe6;
  border: 1px solid #f6c244;
  color: #b8860b;
  font-weight: 600;
  box-shadow: 0 0 4px rgba(246,194,68,0.3);
}

/* 商品列表 */
.product-list-wrapper {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fafafa;
  overflow: hidden;
}

/* 商品滚动区 */
.product-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.info.grid2x2 {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: auto;
  column-gap: 12px;
  row-gap: 3px;
  justify-items: center;
  align-items: center;
  margin: 0 10px;
  min-height: 40px;
}

/* 单元格通用样式 */
.info.grid2x2 .cell {
  width: 100%;
  text-align: center;
  font-size: 13px;
}

/* 细化视觉层级 */
.info.grid2x2 .name { color: #333; font-weight: 600; }
.info.grid2x2 .price { color: #d6a520; font-weight: 700; }
.info.grid2x2 .cycleDays { color: #555; }
.info.grid2x2 .yieldRate { color: #4caf50; font-weight: 700; }

.product img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.product .buy-btn {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.25s;
}

.product .buy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 6px rgba(246,194,68,0.6);
}
</style>
