<template>
  <el-config-provider :locale="epLocale">
    <div class="main">
      <!-- 矿机按钮 -->
      <div class="button-container">
        <button class="tab-button" @click="goMi">
          <span class="icon">🏷</span>
          {{ $t('tab.mine') }}
        </button>
        <button class="tab-button" @click="goTeam">
          <span class="icon">🏷</span>
          {{ $t('tab.team') }}
        </button>
      </div>
      <!-- 内容部分 -->
      <div class="card-container">
        <div class="card">
          <div class="card-header">
            <div class="header-item">
              <span class="we">{{ $t('card.yesterdayOutput') }}:</span>
              <span class="ma">{{ userKjYesterdayIncome }}</span>
            </div>
            <div class="header-item">
              <span class="we">{{ $t('card.yesterdayReward') }}:</span>
              <span class="ma">{{ yesterdayReward }}</span>
            </div>
            <div class="header-item">
              <span class="we">{{ $t('card.teamReward') }}:</span>
              <span class="ma">{{ userTeamKjYesterdayIncome }}</span>
            </div>
            <div class="header-item">
              <span class="we">{{ $t('card.totalIncome') }}:</span>
              <span class="ma">{{ userSumIncomeKj }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="exchange">
              <div class="exchange-header">
                 <div class="guide-price-section">
      <span class="flash-label">{{ $t('exchange.flash') }}：</span>
      <span class="price-tag">{{ styGuidePrice }} USDT</span>
    </div>
                <div class="balance">{{ $t('exchange.balance') }}：{{ styaiBalance }}</div>
              </div>
              <div class="exchange-box">
                <div class="input-row">
                  <input type="number" :placeholder="$t('exchange.inputPlaceholder')" class="input-text" 
                  v-model.trim="amount"/>
                  <button class="btn-all">{{ $t('exchange.all') }}</button>
                </div>
                <button class="btn-confirm" @click="startPay">{{ $t('exchange.confirm') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="mon">
          <span>{{ $t('footer.profitDetail') }}：</span>
          <span class="link" @click="goDetail">{{ $t('footer.profitDetailMore') }} >></span>
        </div>
        <div class="thead">
          <span>{{ $t('footer.currency') }}</span>
          <span>{{ $t('footer.inAmount') }}</span>
          <span>时间</span>

        </div>
        <!-- 只显示前三条数据 -->
         <div v-if="records.length > 0" >
        <div v-for="(rec, i) in records" :key="i" class="row" >
          <span>{{ rec.currency }}</span>
          <span>{{ rec.profitAmount }}</span>
          <span>{{ rec.profitTime }}</span>
        </div>
        </div>
        <div v-else class="row no-data">
         <span style="grid-column: 1 / span 3; text-align: center;">暂无收益记录</span>
        </div>
      </div>
    </div>
  </el-config-provider>
      <!-- 作为“弹窗+状态机”使用：隐藏其内置输入 -->
    <PaymentWidget
      ref="payRef"
      :show-balance="true"
      :show-list="true"
      :show-builtin-input="false"
      :WalletTP="WalletTP"
      :RequestOrder="Exchange"
      :SubmitOrder="SubmitOrder"
  
      @done="onPayDone"
      @close="onPayClose"
    />
</template>
<script setup>
import { ref, computed, onMounted ,nextTick ,onUnmounted} from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUS from 'element-plus/dist/locale/en.mjs'
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import {  userGet,userMachineRecordList,getSTYAIPrice } from "@/utils/api"

import WalletTP from '@/utils/walletTP.js'
import { Exchange, SubmitOrder ,teamMembersAll} from '@/utils/api.js'
import PaymentWidget from '@/components/STTT/PaymentWidget.vue'
import CallbackCenter from '@/utils/callbackCenter.js'

const router = useRouter()
const styaiBalance = inject('styaiBalance', ref(0))
const { t, locale } = useI18n()
const balance = ref(0)  // 初始余额0
const currentTab = ref('mine')
const epLocale = computed(() => (locale.value === 'zh' ? zhCn : enUS))
// 用户信息里的关键字段
const userTeamKjYesterdayIncome = ref(0)
const userSumIncomeKj = ref(0)
const userKjYesterdayIncome = ref(0)
const yesterdayReward = ref(0)

// 矿机收益
const records = ref([])
const total = ref(0)
const size = ref(10)     // 每页条数
const current = ref(1)   // 当前页
// 加载用户信息
async function loadUserInfo() {
  try {
    let res = await teamMembersAll({})
    console.log("userGet 返回:", res)

    // 注意：你的返回格式是 { ok: true, data: { code: 200, data: {...} } }
if (res.data.code === 200) {
  const data = res.data.data
userTeamKjYesterdayIncome.value = Number(data.userAllReward || 0).toFixed(2)
userSumIncomeKj.value            = Number(data.userSumIncomeKj || 0).toFixed(2)
userKjYesterdayIncome.value      = Number(data.userKjYesterdayIncome || 0).toFixed(2)
yesterdayReward.value            = Number(data.userYesterdayReward || 0).toFixed(2)

}

  } catch (err) {
    console.error("加载用户信息失败:", err)
  }
}

// 加载明细
async function loadRecords(page = 1) {
  try {
    let res = await userMachineRecordList({ current: page, size: size.value })
    res=res.data
    console.log('收益明细111111', res)
    if (res.code === 200 && res.data?.records) {
      records.value = res.data.records.map(item => ({
        currency: item.currency || 'STYAI',   // 币种
        profitAmount: item.profitAmount || 0,         // 支入
        profitTime: item.profitTime || 0        // 支出
      }))
        .slice(0, 3)
    } else {
      records.value = []
    }
  } catch (err) {
    console.error("加载失败", err)
  }
}

function goTeam() {
  currentTab.value = 'team'
  router.push('/teampe')
}

function goMi() {
  currentTab.value = 'mine'
  router.push('/mining')
}
function goDetail() {
  router.push('/earning')
}

// 支付组件引用 & 就绪标记
const payRef = ref(null)
const ready = ref(false)
const amount = ref('') // 输入框金额

///////////全局回调
onMounted(() => {
    updateGuidePrice()
    updateGuidePrice()
  CallbackCenter.register('financeUpdate', (info) => {
    console.log("Finance 页面收到登录成功回调", info)
    // 在这里执行余额刷新逻辑
       refresh()
             updateGuidePrice()
  });
  refresh();//封装刷新的方法
})
/////////////////

async function refresh(){
      loadRecords()
    loadUserInfo() 
  await nextTick()
  await loadStyaiBalance()
  await getUser();
  ready.value = true
}

async function getUser() {
  try {
    const res = await userGet({})
    console.log("用户信息:", res)

    if (res && res.data.code === 200 && res.data.data) {
      const code = res.data.data.invitationCodeId
      if (code) {
        localStorage.setItem("invitation_code", code)
        console.log("邀请码已保存:", code)
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("获取用户信息失败:", err)
  }
}


onUnmounted(() => {
  CallbackCenter.unregister('financeUpdate')
})


// ② 拉取余额的方法
async function loadStyaiBalance() {
  try {
    const res = await WalletTP.getTrc20Balance('STYAI')
    if (res?.code === 1) {
      // 兼容数字/字符串，转成字符串展示也行
      styaiBalance.value = res.data?.balance ?? 0
    } else {
      console.warn('getTrc20Balance 返回异常', res)
      styaiBalance.value = 0
    }
  } catch (e) {
    console.error('获取 STYAI 余额失败', e)
    styaiBalance.value = 0
  }
}

// 币种（也可以做成下拉切换）
const wantedToken = ref('STYAI')

// 触发支付
async function startPay(){
  if (!ready.value || !payRef.value) {
    console.warn('PaymentWidget 未挂载完成')
    return
  }
  if (!amount.value || Number(amount.value) <= 0) {
    alert('请输入正确金额')
    return
  }

  const res = await payRef.value.startExternal({
    amount: Number(amount.value),
    token: wantedToken.value,   // 注意 .value
    WalletTP,
    RequestOrder: Exchange,
    SubmitOrder,
    checkTrxEarly: false,
    OrdrId:0
  })
  console.log('支付结果', res)

  if (res?.success) {
    amount.value = ''
    // TODO: 这里可刷新平台余额/充值记录
  }
}

function onPayDone(res){
  console.log('done', res)
  // 可在这里统一刷新数据
}
function onPayClose(){
  console.log('close')
}


////////////===========================
// 指导价数据
const styGuidePrice = ref(0.5)
const priceTrend = ref(0.35)
const priceHistory = ref([0.45, 0.48, 0.52, 0.50, 0.55])
const updateGuidePrice = () => {
  const today = new Date().getDay()
  const tradingDays = [1, 2, 3, 4, 5] 
  
  if (tradingDays.includes(today)) {
    const lastPrice = priceHistory.value[priceHistory.value.length - 1]
    const change = (Math.random() * 0.1 - 0.05).toFixed(4)
    const newPrice = Math.max(0.01, parseFloat((lastPrice + change).toFixed(4)))
    
    priceHistory.value.push(newPrice)
    if (priceHistory.value.length > 5) priceHistory.value.shift()
    
    const prevPrice = priceHistory.value[priceHistory.value.length - 2] || newPrice
    priceTrend.value = ((newPrice - prevPrice) / prevPrice * 100).toFixed(2)
    styGuidePrice.value = newPrice
  }
}


</script>

<style>
/* 替换这段：让页面能滚动 */
.main {
  background: #000;
  /* height: 100vh;  <-- 删掉这句 */
  min-height: 100vh;
  /* 改成最小高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  /* 只隐藏横向 */
  overflow-y: auto;
  /* 允许纵向滚动 */
}

/* 光效永远在最底层，且不挡交互 */
.main::after {
  content: "";
  position: absolute;
  top: 60%;
  left: 60%;
  width: 300px;
  height: 700px;
  transform: translate(-50%, -50%) rotate(45deg);
  background: radial-gradient(circle,
      rgba(248, 231, 131, 0.6) 0%,
      rgba(245, 159, 0, 0.3) 50%,
      rgba(182, 11, 11, 0) 80%);
  filter: blur(120px);
  z-index: -1;
  /* 关键：放到内容下方 */
  pointer-events: none;
  /* 不影响点击/输入 */
}



.button-container {
  display: flex;
  gap: 10px;
  margin-top: 60px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 22px;
  background: #fff;
  color: #333;
  border: 1px solid #e5e5e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  position: relative;
  /* 增加相对定位 */
}

.tab-button .icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid gold;
  color: gold;
  font-size: 14px;
  background: #fff;
  position: relative;
  /* 增加相对定位 */
  z-index: 1;
  /* 确保图标在上层 */
}

/* 增加点击区域 */
.tab-button::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: transparent;
  z-index: 0;
  /* 确保伪元素在图标下方 */
}

.we {
  width: 60%;
  display: inline-block;
  margin-left: 10px;
  margin-top: 7px;
  margin-bottom: 6px;
}

.ma {
  width: 30%;
  display: inline-block;
}

/* contain */
.card-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-left: 5%;
  padding-left: 5%;
  border: 1px #b9b9b9 solid;
  border-radius: 10px;
  /* 圆角 */
  width: 76%;
  margin-top: 20px;
}


.card-header {
  white-space: pre-wrap;
  font-size: 18px;
  color: rgb(0, 0, 0);
  /* 使用纯黑色 */
  background-color: rgb(255, 255, 255);
  /* 纯白色背景 */
  width: 94%;
  margin-left: 3%;
  border-radius: 15px;
  z-index: 11;
}

.exchange {
  color: #000;
  background-color: rgba(212, 208, 208, 0.5);
  /* 设置半透明灰色背景 */
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
  width: 90%;
  margin-left: 4%;
  background: #e0dfdf;
}

.exchange::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(212, 208, 208, 0.5);
  border-radius: 10px;
  z-index: -1;
}

.exchange-box {
  width: 260px;
  margin: 20px auto;
  text-align: center;
  font-family: "Microsoft YaHei", sans-serif;
}

.input-row {
  display: flex;
  background: #fff;
  width: 72%;
  width: 72%;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  
  
}

.input-text {
  width: 65%;
  flex: 1;
  border: none;
  padding: 8px 10px;
  outline: none;
}

.btn-all {
  background: none;
  border: none;
  padding: 0 12px;
  color: #333;
  cursor: pointer;
}

.btn-confirm {
  width: 50%;
  background: #f6c244;
  margin-right: 27%;
  margin-right: 27%;
  border: none;
  padding: 10px 0;
  border-radius: 20px;
  font-size: 15px;
  color: #333;
  font-weight: bold;
  cursor: pointer;
}

.footer {

  width: 78%;
  margin: 20px 0 32px;
  padding: 12px 14px 18px;
  background: #000;
  border: 1px solid #b9b9b9;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}


.footer::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  width: 180%;
  height: 180%;
  transform: translateX(-50%) scaleY(.55);
  background: radial-gradient(ellipse at 50% 0%,
      rgba(255, 215, 0, .70) 0%,
      rgba(255, 193, 7, .40) 38%,
      rgba(184, 134, 11, .22) 60%,
      rgba(0, 0, 0, .96) 100%);
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

.mon {
  position: relative;
  z-index: 1;
  color: #f6c244;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 8px;
  font-size: 14px;
}


.thead {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 8px;
  padding: 10px 12px;
  color: #eaeaea;
  font-size: 13px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  width: 100%;
  /* 修正 width:0.8 的错误值 */
}

.row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 8px;
  padding: 10px 12px;
  color: #ddd;
  font-size: 13px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}

.row:last-child {
  border-bottom: 0;
}

@media (max-width: 480px) {

  .thead,
  .row {
    grid-template-columns: 1fr 1fr 1fr;
    font-size: 12px;
  }
}

.exchange {
  position: relative;
}
</style>