import { request } from "./request";


// ================== 用户 ==================
export const userInit      = (data) => request(1, '/api/user/init', data)
export const userLogin     = (data) => request(1, '/api/user/login', data)
export const userRegister  = (data) => request(1, '/api/user/register', data)
export const userDelete    = (data) => request(1, '/api/user/delete', data)
export const userUpdate    = (data) => request(1, '/api/user/update', data)
export const userGet = (data) => request(1, '/api/user/get', data)
export const getSTYAIPrice = (data) => request(1, '/api/sty-exchange/price', null)

export const userList      = (data) => request(1, '/api/user/list', data)
export const userUpdatePassword = (data) => request(1, '/api/user/update/paswad', data)
export const buyFinancialProduct = (data) =>request(1, '/api/user-machine/buy', data)

// ================== 钱包 ==================
export const walletAdd     = (data) => request(1, '/api/wallet/add', data)
export const walletDelete  = (data) => request(1, '/api/wallet/delete', data)
export const walletUpdate  = (data) => request(1, '/api/wallet/update', data)
export const walletGet     = (data) => request(1, '/api/wallet/get', data)
export const walletList    = (data) => request(1, '/api/wallet/list', data)

// ================== 团队 ==================
export const teamAdd       = (data) => request(1, '/api/team/add', data)
export const teamDelete    = (data) => request(1, '/api/team/delete', data)
export const teamUpdate    = (data) => request(1, '/api/team/update', data)
export const teamGet       = (data) => request(1, '/api/team/get', data)
export const teamList      = (data) => request(1, '/api/team/list', data)
export const teamAll     = (data) => request(1, '/api/team/all', data)
export const teamMembersAll = (data) => request(1, '/api/team/members/all', data)

// ================== 矿机 ==================
export const miningAdd     = (data) => request(1, '/api/mining-machine/add', data)
export const miningDelete  = (data) => request(1, '/api/mining-machine/delete', data)
export const miningUpdate  = (data) => request(1, '/api/mining-machine/update', data)
export const miningGet     = (data) => request(1, '/api/user-machine/get', data)
export const miningList    = (data) => request(1, '/api/mining-machine/list', data)
export const userMachineRecordList = (data) => request(1, '/api/user-machine-record/list', data)

// ================== 静态理财 ==================
export const staticAdd     = (data) => request(1, '/api/static-product/add', data)
export const staticDelete  = (data) => request(1, '/api/static-product/delete', data)
export const staticUpdate  = (data) => request(1, '/api/static-product/update', data)
export const staticGet     = (data) => request(1, '/api/static-product/get', data)
export const staticList    = (data) => request(1, '/api/static-product/list', data)
export const staticFindByType = (type) => request(1, `/api/user-finance/find/type/${type}`)

//=================== 理财产品 ===================
export const getProductAllStatic =(data) => request(1, `/api/static-product/all`,data) //静态理财
export const getProductAllSynamic = (data) => request(1, `/api/dynamic-product/all`,data) //动态理财
export const buyProduct=(data)=>request(1,'/api/product/Financial/local/buy',data);


// ================== 动态理财 ==================
export const dynamicAdd    = (data) => request(1, '/api/dynamic-product/add', data)
export const dynamicDelete = (data) => request(1, '/api/dynamic-product/delete', data)
export const dynamicUpdate = (data) => request(1, '/api/dynamic-product/update', data)
export const dynamicGet    = (data) => request(1, '/api/dynamic-product/get', data)
export const dynamicList   = (data) => request(1, '/api/dynamic-product/list', data)
export const dynamicFindByType = (type) => request(1, `/api/user-finance/find/type/${type}`)
// ================== 理财收益 ==================
export const financialRecord = (type) => request(1, `/api/user-finance-record/all`)
// ================== 用户矿机产出 ==================
export const userMiningAdd    = (data) => request(1, '/api/user-mining-output/add', data)
export const userMiningDelete = (data) => request(1, '/api/user-mining-output/delete', data)
export const userMiningUpdate = (data) => request(1, '/api/user-mining-output/update', data)
export const userMiningGet    = (data) => request(1, '/api/user-mining-output/get', data)
export const userMiningList   = (data) => request(1, '/api/user-mining-output/list', data)
export const getAllMiningMachines = (data) => 
  request(1, '/api/mining-machine/all', data)

// ================== 用户资金 ==================
export const RequestOrder    = (data) => request(1, '/api/capital/RequestOrder', data)
export const contract = (data) => request(1, '/api/capital/contract', data)
export const SubmitOrder = (data) => request(1, '/api/capital/SubmitOrder', data)
export const Exchange = (data) => request(1, '/api/capital/Exchange', data)
export const Withdraw = (data) => request(1, '/api/capital/Withdraw', data)

// ================== 支付 ==================
export const paymentAdd    = (data) => request(1, '/api/payment/add', data)
export const paymentDelete = (data) => request(1, '/api/payment/delete', data)
export const paymentUpdate = (data) => request(1, '/api/payment/update', data)
export const paymentGet    = (data) => request(1, '/api/payment/get', data)
export const paymentList   = (data) => request(1, '/api/payment/list', data)

// ================== STY 交易池 ==================
export const styAdd        = (data) => request(1, '/api/sty-exchange/add', data)
export const styDelete     = (data) => request(1, '/api/sty-exchange/delete', data)
export const styUpdate     = (data) => request(1, '/api/sty-exchange/update', data)
export const styGet        = (data) => request(1, '/api/sty-exchange/get', data)
export const styList       = (data) => request(1, '/api/sty-exchange/list', data)
export const styTrade = (data) => request(1, '/api/sty-exchange/trade', data)
export const styGetAll     = (data) => request(1, '/api/sty-exchange/get/all', data) 
// ================== 签到 ==================
export const signDo        = (data) => request(1, '/sign/do', data)
export const signStatus    = (data) => request(1, '/sign/status', data)
export const signRecord    = (data) => request(1, '/sign/record/month', data)
export const signResign = (data) => request(1, '/sign/resign', data)

// ================== Tron 链 ==================
export const tronBalance   = (address) => request(0, `/api/tron/balance/${address}`)
export const tronValidate  = (data) => request(1, '/wallet/validateaddress', data)
export const tronResources = (data) => request(1, '/wallet/getaccountresource', data)
export const tronAccount   = (address) => request(0, `/v1/accounts/${address}`)
export const tronTrc20Tx   = (address) => request(0, `/v1/accounts/${address}/transactions/trc20`)

// ================== 动态表 ==================
export const tableAll      = () => request(0, '/api/dynamic-table/tables')
export const tableFind     = (tableName) => request(0, `/api/dynamic-table/find/${tableName}`)
export const tableGet      = (tableName, id) => request(0, `/api/dynamic-table/${tableName}/${id}`)
export const tableInsert   = (tableName, data) => request(1, `/api/dynamic-table/${tableName}`, data)
export const tableUpdate   = (tableName, id, data) => request(1, `/api/dynamic-table/${tableName}/${id}`, data)
// eslint-disable-next-line no-undef
export const tableDelete   = (tableName, id) => request(1, `/api/dynamic-table/${tableName}/${id}`, data)
// ================== vip ==================
export const productVip    = (data) => request(1, '/api/product/vip', data)
export const vipUserStatus = (data) => request(1, '/api/vip/user', data)   // 查询当前登录用户是否是VIP
// ================== 平台流水 ==================
export const userPlatformFlowSelect = (type, data) => request(1, `/api/UserPlatformFlow/select/${type}`, data)
export const userCompany =  (data) => request(1, '/api/content-config/get', data)
export const styOrdersByType = (data) => request(1, '/api/sty-exchange/my-orders/by-type/'+data.type, null)
export const styOrdersBystatus = (data) => request(1, '/api/sty-exchange/my-orders/by-status/'+data.type, null)
export const styOrdersDelete = (data) => request(1, '/api/sty-exchange/delete', null)
// ================== 平台余额 ==================
export const userPlatformBalance = (data) =>request(1, '/api/UserPlatformFlow/select/by-user/balance', data)
    




export const styExchangeRate = (payload) => {

  let data = payload
  if (typeof payload === 'number' || typeof payload === 'string') {
    data = { amount: Number(payload) }
  } else if (payload && payload.amount != null && payload.styNum == null) {
    data = { amount: Number(payload.amount) }
  }
  return request(1, '/api/sty-exchange/Calculate/exchange-rate', data)
}


export const stySell = (data) => request(1, '/api/product/sty/sell', data)
export const getField = (data) => request(1, '/api/content-config/field', data)
export const styBuy=(data) => request(1,'/api/product/sty/buy', data)
export const buyPurchase = (data) => request(1, '/api/product/sty/purchase', data)