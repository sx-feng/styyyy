<template>
  <div class="finance-page">
    <div class="card card-actions">

      <!-- 出售 / 求购按钮 -->
      <div class="buy-sell">
        <button class="btn sell" @click="openSellDialog">出售 STY</button>
        <button class="btn sell" @click="openPurchaseDialog">求购 STY</button>
      </div>

      <!-- 交易记录 -->
      <div class="record">
        <div class="record-box" @click="goBuyRecord">求购记录</div>
        <div class="record-box" @click="goSellRecord">出售记录</div>
      </div>

      <!-- 商品池 -->
      <div class="shop">
        <div class="shop-tabs">
          <button :class="{ active: activePool === 'buy' }" @click="activePool='buy'; getShopList()">我要求购</button>
          <button :class="{ active: activePool === 'sell' }" @click="activePool='sell'; getShopList()">我要出售</button>
        </div>

        <div class="shop-list">
          <div class="shop-item" v-for="item in shopList" :key="item.id">
            <div class="shop-info">
              <div class="shop-header">
                <span class="order-id">订单号：{{ item.id }}</span>
                <span class="status" :class="'status-' + item.orderStatus">{{ formatStatus(item.orderStatus) }}</span>
              </div>
              <div class="shop-row">
                <span>数量：<b>{{ item.styAmount }}</b> STY</span>
                <span>金额：<b>{{ item.usdtAmount }}</b> USDT</span>
              </div>
            </div>
            <button class="btn buy" @click="buyItem(item)">{{ activePool==='buy' ? '购买' : '卖出' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 出售弹窗 -->
    <div v-if="showSellDialog" class="dialog-mask">
      <div class="dialog-box sell-box">
        <div class="sell-input row">
          <label>单价：</label>
          <input type="number" v-model="sellPrice" :min="minSellPrice" />
          <span class="unit">USDT</span>
        </div>
        <div class="sell-input row">
          <label>数量：</label>
          <input type="number" v-model="sellAmount" />
          <span class="unit">STY</span>
        </div>
        <div class="dialog-actions">
          <button @click="confirmSell" class="sell-confirm">确认出售</button>
          <button @click="showSellDialog=false" class="sell-cancel">取消</button>
        </div>
      </div>
    </div>

    <!-- 求购弹窗 -->
    <div v-if="showPurchaseDialog" class="dialog-mask">
      <div class="dialog-box sell-box">
        <div class="sell-input row">
          <label>单价：</label>
          <input type="number" v-model="purchasePrice" :min="minPrice" />
          <span class="unit">USDT</span>
          <label>数量：</label>
          <input type="number" v-model="purchaseAmount" />
          <span class="unit">STY</span>
        </div>
        <div class="dialog-actions">
          <button @click="confirmPurchase" class="sell-confirm">确认求购</button>
          <button @click="showPurchaseDialog=false" class="sell-cancel">取消</button>
        </div>
      </div>
    </div>

    <!-- 支付组件 -->
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
import { ref, onMounted } from "vue"
import router from '@/router'
import { styGetAll, stySell, styBuy, buyPurchase, styExchangeRate, SubmitOrder } from '@/utils/api'
import CallbackCenter from "@/utils/callbackCenter"
import WalletTP from '@/utils/walletTP.js'
import PaymentWidget from '@/components/STTT/PaymentWidget.vue'

// === 核心交易池状态 ===
const shopList = ref([])
const allOrders = ref([])
const activePool = ref('buy')

// === 出售相关 ===
const showSellDialog = ref(false)
const sellAmount = ref(0)
const sellPrice = ref(1.2)
const minSellPrice = ref(1.2)

// === 求购相关 ===
const showPurchaseDialog = ref(false)
const purchaseAmount = ref(0)
const purchasePrice = ref(1.2)
const minPrice = ref(1.2)

const payRef = ref(null)
const ready = ref(false)

// 获取交易池
async function getShopList() {
  const res = await styGetAll({})
  if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
    allOrders.value = res.data.data
  } else {
    allOrders.value = []
  }
  filterShopList()
}

function filterShopList() {
  shopList.value = allOrders.value.filter(item => {
    if (activePool.value === 'buy') return item.orderType === 1
    if (activePool.value === 'sell') return item.orderType === 2
  })
}

function formatStatus(status) {
  switch (status) {
    case 0: return '待成交'
    case 1: return '已成交'
    case 2: return '已取消'
    default: return '未知'
  }
}

// 出售
function openSellDialog() { showSellDialog.value = true }
async function confirmSell() {
  if (Number(sellAmount.value) <= 0) return alert('请输入数量')
  CallbackCenter.trigger('openTwoPasswordDialog', async (pwdMd5) => {
    startPay(0, stySell)
  })
}

// 求购
function openPurchaseDialog() { showPurchaseDialog.value = true }
async function confirmPurchase() {
  if (Number(purchaseAmount.value) <= 0) return alert('请输入数量')
  CallbackCenter.trigger('openTwoPasswordDialog', async (pwdMd5) => {
    const res = await buyPurchase({
      styAmount: String(purchaseAmount.value),
      usdtAmount: String((purchaseAmount.value * purchasePrice.value).toFixed(2)),
      price: String(purchasePrice.value),
      paymentId: "1",
      remark: "挂买单求购 STY",
      twoPassword: pwdMd5
    })
    if (res?.data?.code === 200) {
      alert("挂买单成功！")
      showPurchaseDialog.value = false
    } else {
      alert(res?.data?.message || "挂买单失败")
    }
  })
}

// 买入/卖出订单
function buyItem(item) {
  if (!item.id) return alert('缺少订单ID')
  if (item.orderType === 2) {
    CallbackCenter.trigger('openTwoPasswordDialog', async (pwdMd5) => {
      sellAmount.value = item.styAmount
      startPay(item.id, styBuy)
    })
  } else {
    CallbackCenter.trigger('openTwoPasswordDialog', async (pwdMd5) => {
      const res = await styBuy({ orderId: item.id, twoPassword: pwdMd5 })
      if (res?.data?.code === 200) {
        alert(`购买成功: 订单号 ${item.id}`)
      } else {
        alert(res?.data?.message || '购买失败')
      }
    })
  }
}

// 统一支付
async function startPay(orderId, fun) {
  if (!ready.value || !payRef.value) return
  const res = await payRef.value.startExternal({
    amount: Number(sellAmount.value),
    token: "STYAI",
    WalletTP,
    RequestOrder: fun,
    SubmitOrder,
    checkTrxEarly: false,
    orderId
  })
  console.log('支付结果', res)
}

function onPayDone(res) { console.log('done', res) }
function onPayClose() { console.log('close') }

onMounted(() => {
  getShopList()
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



.tab-btn {
  background: #fff5d6;  
  color: #b8860b;        
  border: 1px solid #f6c244;
  border-radius: 14px;   
  padding: 8px 14px;     
  font-size: 13px;       
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.tab-btn.active {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  box-shadow: 0 0 12px rgba(246, 194, 68, 0.6);
}




/* 白色卡片 */
.card {
  background: #fff;
  border-radius: 20px;
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

.dynamic-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 12px;
}

.dynamic-row .rate {
  color: #555;
}

.dynamic-row .detail {
  color: #f6c244;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 12px 0;
}

.static-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: #444;
}

.static-row:not(:last-child) {
  border-bottom: 1px dashed #ddd;
}

/* 买卖 STY */
.card-actions .buy-sell {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.card-actions .btn {
  flex: 1;
  margin: 0 8px;
  padding: 10px 0;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: .25s;
}

.btn.buy {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
}

.btn.sell {
  background: linear-gradient(90deg, #ff8c42, #d65f20);
  color: #000;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 10px rgba(246, 194, 68, 0.5);
}

.card.card-actions {
  max-width: 360px;
  margin-bottom: 40px;
}

/* 记录 */
.record {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.record-box {
  flex: 1;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  border-right: 1px solid #ddd;
}

.record-box:last-child {
  border-right: none;
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

/* Shop 外层：竖向滑动区域 */
.shop {
  margin-top: 20px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 6px;
}

/* 每个商品卡片 */
.shop-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.shop-price {
  color: #d4af37;
  font-size: 14px;
}

/* 按钮 */
.shop-item .btn.buy {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f6c244, #d6a520);
  border: none;
  color: #000;
  font-weight: 500;
  cursor: pointer;
  transition: .25s;
  width: fit-content;
  max-width: 100px;
}

.shop-item .btn.buy:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 6px rgba(246, 194, 68, 0.5);
}

/* 弹窗遮罩 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* 弹窗内容 */
.dialog-box {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 80%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dialog-box h3 {
  margin-bottom: 14px;
  color: #333;
}

.dialog-box input {
  width: 100%;
  padding: 8px;
  margin-bottom: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: space-around;
}

.dialog-btn {
  flex: 1;
  margin: 0 6px;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.25s;
}

.dialog-btn.confirm {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
}

.dialog-btn.cancel {
  background: #ccc;
  color: #000;
}

.price {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}


.price-value {
  font-weight: bold;
  color: #000;
}

.unit {
  color: #888;
  margin-left: 4px;
}

/* 输入框区域 */
.sell-input {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.sell-input label {
  flex: 1;
  font-size: 14px;
  color: #444;
}

.sell-input input {
  flex: 2;
  padding: 8px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 0 6px;
}

.max-btn {
  color: #337ab7;
  font-size: 14px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}

.max-btn:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* 信息区域 */
.sell-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row.highlight span:last-child {
  color: #d65f20;
  font-weight: bold;
}

/* 操作按钮 */
.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sell-confirm {
  background: #000;
  color: #fff;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.sell-confirm:hover {
  background: #222;
}

.sell-cancel {
  background: #eee;
  color: #333;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.sell-cancel:hover {
  background: #ddd;
}

/* 弹窗动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.card {
  background: #fff;
  border-radius: 30px;
  padding: 16px;
  width: 92%;
  max-width: 520px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 顶部说明按钮 */
.tab-btn {
  display: inline-block;
  background: #fff;
  color: #f6c244;
  border: 1px solid #f6c244;
  border-radius: 15px;
  padding: 10px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;
}
.tab-btn:hover {
  background: #fff8e1;
  box-shadow: 0 0 4px rgba(246,194,68,0.5);
}
.tab-btn.active {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  border: none;
}


/* 动静理财切换 */
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

/* 激活状态：淡金底 + 金色边框 + 深色文字 */
.sty-btn button.active {
  background: #fffbe6;            /* 柔和浅金色，而不是浓烈的渐变 */
  border: 1px solid #f6c244;
  color: #b8860b;                 /* 深金色文字 */
  font-weight: 600;
  box-shadow: 0 0 4px rgba(246,194,68,0.3);
}


/* 分割线 */
.gold-divider {
  height: 1px;
  margin: 10px 0;
  background: #ffed84;
  border-radius: 2px;
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

/* 底部固定区域 */
.list-footer {
  padding: 8px;
  text-align: center;
  font-size: 16px;
  color: #dab616;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  font-weight: 500;
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
.info{
  flex: 1;
  display: flex;
 margin-top: 15px;
  gap: 16px;  
}
.product img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  
}
.product .name {
  flex: 1;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  margin-left: 10px;
}
.product .price {
  margin-right: 10px;
  color: #d6a520;
  font-weight: bold;
  font-size: 14px;
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


/* 商品池子 */
.shop-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-info {
  flex: 1;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #555;
}

.order-id {
  font-weight: 600;
  color: #333;
}

.status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
  color: #fff;
}
.status-0 { background: #f6c244; }  /* 待成交 - 黄色 */
.status-1 { background: #4caf50; }  /* 已成交 - 绿色 */
.status-2 { background: #f44336; }  /* 已取消 - 红色 */

.shop-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.shop-row b {
  color: #000;
}

.shop {
 
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

/* 顶部切换按钮（不滚动） */
.shop-tabs {
  display: flex;
  justify-content: space-around;
  background: #fff8e1;
  border-radius: 10px;
  margin-bottom: 10px;
}

.shop-tabs button {
  flex: 1;
  border: none;
  background: transparent;
  border-radius: 30px;
  font-weight: 600;
  padding: 6px 0;
  cursor: pointer;
  transition: 0.25s;
}

.shop-tabs button.active {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  box-shadow: 0 0 6px rgba(246, 194, 68, 0.4);
}

/* 商品列表单独滚动 */
.shop-list {
  max-height: 240px;   /* 控制滚动高度 */
  overflow-y: auto;
  padding-right: 6px;
}



</style>
