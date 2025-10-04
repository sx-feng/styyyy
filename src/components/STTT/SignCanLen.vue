<template>
  <div class="sign-card">
    <div class="sign-head">
      <div class="title">
        {{ year }} {{ $t('sign.year') }} {{ month }} {{ $t('sign.month') }}
      </div>
      <div class="meta">
        {{ $t('sign.streak') }}：<b>{{ streakDays }}</b>
        <span class="dot">•</span>
        {{ $t('sign.missed') }}：
        <b :class="{ danger: missedDays > maxMiss }">{{ missedDays }}</b> / {{ maxMiss }}
      </div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar">
      <div class="wday" v-for="w in tm('sign.weekdays')" :key="w">{{ w }}</div>
      <div v-for="cell in cells" :key="cell.key" class="cell"
           :class="{
             'is-empty': !cell.day,
             'is-signed': cell.signed,
             'is-today': cell.isToday,
             'is-missed': cell.isPast && !cell.signed,
             'is-resigned': cell.isResigned   // 新增
           }">
        <div v-if="cell.day" class="day">
          <span class="num">{{ cell.day }}</span>
          <span v-if="cell.signed" class="mark">✔</span>
          <span v-else-if="cell.isPast" class="miss">•</span>
        </div>
      </div>
    </div>

    <!-- 动作区 -->
    <div class="actions">
      <el-button type="primary"
                 :disabled="isTodaySigned || signing"
                 :loading="signing"
                 @click="signToday">
        {{ $t('sign.signNow') }}
      </el-button>
      <el-button type="warning"
           :disabled="resignDisabled"
           :loading="resigning"
           @click="autoResign">
  {{ $t('sign.reSign') }}
</el-button>


      <span class="tip" v-if="locked">
        {{ $t('sign.locked', { max: maxMiss }) }}
      </span>
      <span class="tip" v-else-if="isTodaySigned">{{ $t('sign.todaySigned') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { signDo, signRecord, signResign } from '@/utils/api'

const { t, tm } = useI18n()
const maxMiss = 2

/** 日期工具 */
const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1
const pad = (n) => (n < 10 ? '0' + n : '' + n)
const ymKey = `${year}-${pad(month)}`
const daysInMonth = new Date(year, month, 0).getDate()
const todayDay = now.getDate()
const todayStr = `${year}-${pad(month)}-${pad(todayDay)}`

/** 本月签到数据（后端返回） */
const signedSet = ref(new Set())
const signing = ref(false)


// 拉取签到记录
// 拉取签到记录
async function fetchSignRecord() {
  try {
    const res = await signRecord({ yearMonth: ymKey })
    if (res.data.code === 200) {
      const list = Array.isArray(res.data.data) ? res.data.data : []
      
      const normal = []
      const resigned = []

      for (const item of list) {
        if (item.signDate) {
          if (item.isResignSign) {
            resigned.push(item.signDate)
          } else {
            normal.push(item.signDate)
          }
        }
      }

      signedSet.value = new Set(normal.concat(resigned)) // 所有签到（包含补签）
      resignedSet.value = new Set(resigned)              // 单独的补签日期
    } else {
      ElMessage.error(res.data.message || '加载签到记录失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}


/** 签到 */
async function signToday() {
  if (isTodaySigned.value) return
  signing.value = true
  try {
    const res = await signDo({ date: todayStr })
    if (res.data.code === 200) {
      ElMessage.success(res.data.message || t('sign.success'))
      await fetchSignRecord()
      triggerAnim()
    } else if (res.data.code === 401) {
      ElMessage.warning(res.data.message || '今天已经签过到了')
      await fetchSignRecord()
    } else {
      ElMessage.error(res.data.message || '签到失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    signing.value = false
  }
}

/** 补签 */
// ====== 补签逻辑（自动补最近漏签的那天） ======
const resignUsed = ref(0)      // 已补签次数（最好从后端返回）
const resigning = ref(false)   // 补签按钮的 loading
const resignedSet = ref(new Set()) // 补签日期集合

// 最近漏签日期（今天之前，倒着找第一个漏签的日子）
const lastMissedDay = computed(() => {
  for (let d = todayDay - 1; d >= 1; d--) {
    const ds = `${year}-${pad(month)}-${pad(d)}`
    if (!signedSet.value.has(ds)) {
      return ds
    }
  }
  return null
})

// 禁用条件：没有漏签 或 已用光补签次数
const resignDisabled = computed(() =>
  !lastMissedDay.value || resignUsed.value >= maxMiss
)
async function autoResign() {
  if (!lastMissedDay.value) {
    ElMessage.warning('没有可补签的日期')
    return
  }
  if (resignUsed.value >= maxMiss) {
    ElMessage.error(`本月补签机会已用完（${maxMiss} 次）`)
    return
  }
  resigning.value = true
  try {
    const res = await signResign({ date: lastMissedDay.value })
    if (res.data.code === 200) {
      ElMessage.success(res.data.message || `补签成功：${lastMissedDay.value}`)
      resignUsed.value++
       resignedSet.value.add(lastMissedDay.value) 
      await fetchSignRecord()
    } else {
      ElMessage.error(res.data.message || '补签失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    resigning.value = false
  }
}

/** 计算属性 */
const isTodaySigned = computed(() => signedSet.value.has(todayStr))

const missedDays = computed(() => {
  let miss = 0
  for (let d = 1; d < todayDay; d++) {
    const ds = `${year}-${pad(month)}-${pad(d)}`
    if (!signedSet.value.has(ds)) miss++
  }
  return miss
})

const locked = computed(() => missedDays.value > maxMiss)

const streakDays = computed(() => {
  let cnt = 0
  for (let d = todayDay; d >= 1; d--) {
    const ds = `${year}-${pad(month)}-${pad(d)}`
    if (signedSet.value.has(ds)) cnt++
    else break
  }
  return cnt
})

function firstDayOffset() {
  const w = new Date(year, month - 1, 1).getDay()
  return (w + 6) % 7
}

const cells = computed(() => {
  const offset = firstDayOffset()
  const total = Math.ceil((offset + daysInMonth) / 7) * 7
  const arr = []
  for (let i = 0; i < total; i++) {
    const day = i - offset + 1
    if (day < 1 || day > daysInMonth) {
      arr.push({ key: `e-${i}`, day: 0 })
      continue
    }
    const ds = `${year}-${pad(month)}-${pad(day)}`
    arr.push({
      key: ds,
      day,
      signed: signedSet.value.has(ds),
      isToday: day === todayDay,
      isPast: day < todayDay,
      isResigned: resignedSet.value.has(ds)  // 新增
    })
  }
  return arr
})

function triggerAnim() {
  const el = document.querySelector('.cell.is-today')
  if (el) {
    el.classList.remove('is-signed')
    void el.offsetWidth
    el.classList.add('is-signed')
  }
}

onMounted(() => {
  fetchSignRecord()
})
</script>

<style scoped>
.sign-card {
  
  background: #0f0f0f;
  color: #eee;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 14px;
  padding: 16px 16px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35);
}

.sign-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #ffd34d;
}

.meta {
  font-size: 13px;
  color: #bbb;
}
.meta .dot {
  margin: 0 8px;
  opacity: .5;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 10px;
  padding: 10px;
}

.wday {
  text-align: center;
  font-size: 12px;
  color: #9aa0a6;
  padding: 6px 0;
}

.cell {
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .02);
  border: 1px dashed rgba(255, 255, 255, .06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell.is-empty {
  background: transparent;
  border: none;
}

.day {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
}

.num {
  font-weight: 600;
  color: #e8eaed;
}

.mark {
  color: #22c55e;
  font-weight: 700;
}

.miss {
  color: rgba(255, 255, 255, .28);
  font-size: 20px;
  line-height: 1;
  margin-top: -2px;
}

.cell.is-today {
  border-color: rgba(255, 211, 77, .7);
  box-shadow: inset 0 0 0 1px rgba(255, 211, 77, .35);
}

.cell.is-signed {
  background: rgba(34, 197, 94, .12);
  border-color: rgba(34, 197, 94, .35);
}

.cell.is-missed {
  background: rgba(255, 255, 255, .02);
}
/* 补签 */
.cell.is-resigned {
  background: rgba(239, 68, 68, .15); /* 红色背景 */
  border-color: rgba(239, 68, 68, .5);
}
.cell.is-resigned .mark {
  color: #ef4444; /* 红色对号 */
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.tip {
  font-size: 12px;
  color: #9aa0a6;
}
.cell.is-today.is-signed {
  animation: pulse 0.4s ease;
}
@keyframes pulse {
  0% { transform: scale(0.8); background: rgba(34,197,94,.4); }
  100% { transform: scale(1); }
}
.tip.danger,
.meta b.danger {
  color: #ff6b6b !important;
}
</style>
