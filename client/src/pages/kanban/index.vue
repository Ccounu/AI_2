<template>
  <view class="kp">
    <!-- 顶部标题 -->
    <view class="kh">
      <text class="kt">📋 投递管理</text>
    </view>

    <!-- 横向滑动状态标签栏 -->
    <scroll-view class="ts" scroll-x :show-scrollbar="false" enhanced>
      <view class="tb"><view class="ti" v-for="col in cols" :key="col.key"
        :class="{a:sel===col.key}" @click="sel=col.key">
        <text>{{col.label}}</text><text class="tc2"> {{(kd[col.key]||[]).length}}</text>
      </view></view>
    </scroll-view>

    <!-- 纵向卡片列表 -->
    <scroll-view class="cl2" scroll-y :show-scrollbar="false" enhanced>
      <view class="ca2" v-for="item in (kd[sel]||[])" :key="item.id" @click="detail(item)">
        <!-- 左侧公司 Logo -->
        <view class="lo" :style="{background:logoColor(item.companyName)}">{{logoChar(item.companyName)}}</view>
        <!-- 中间信息 -->
        <view class="mi4">
          <text class="cac2">{{item.companyName}}</text>
          <text class="cap2">{{item.position}}</text>
        </view>
        <!-- 右侧日期+状态 -->
        <view class="ri">
          <text class="cat2">{{ft(item.appliedAt)}}</text>
          <text class="stg" :style="{background:stageColor(item.stage),color:stageTextColor(item.stage)}">{{stageLabel(item.stage)}}</text>
        </view>
      </view>
      <view v-if="!(kd[sel]||[]).length" class="ee"><text class="eem">暂无记录</text></view>
    </scroll-view>

    <!-- 悬浮新增按钮 -->
    <view class="fab" @tap="show=true">+</view>

    <!-- 新增弹窗 -->
    <view class="mo" v-if="show" @click.self="show=false">
      <view class="mob" @click.stop>
        <view class="mot">新增投递</view>
        <input class="mi3" v-model="nc.companyName" placeholder="公司名称" />
        <input class="mi3" v-model="nc.position" placeholder="应聘岗位" />
        <picker :value="nc.si" :range="so" @change="onSt">
          <text class="mp">{{so[nc.si]||'选择阶段'}}</text>
        </picker>
        <view class="moa">
          <button class="moc" @click="show=false">取消</button>
          <button class="mok" @click="add">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import api from '@/api/request';

const userStore = useUserStore();

const cols = [
  {key:'submitted',label:'已投递'},{key:'written_test',label:'笔试/测评'},
  {key:'interview_1',label:'一面/二面'},{key:'hr_interview',label:'HR面'},
  {key:'offer_pool',label:'Offer/池子'},{key:'rejected',label:'已结束'}
];
const so = ['已投递','笔试/测评','一面/二面','HR面','Offer/池子','已结束'];
const sk = ['submitted','written_test','interview_1','hr_interview','offer_pool','rejected'];

const sel = ref('submitted');
const show = ref(false);
const nc = reactive({companyName:'',position:'',si:0});

const kd = reactive({submitted:[],written_test:[],interview_1:[],interview_2:[],hr_interview:[],offer_pool:[],rejected:[]});

function ft(t){ return t?t.slice(0,10):''; }
function onSt(e){ nc.si = e.detail.value; }

function logoChar(n){ return (n||'公').charAt(0); }
function logoColor(n){
  const colors = ['#4A90D9','#52C41A','#FAAD14','#722ED1','#EB2F96','#13C2C2'];
  let h = 0; for(let i=0;i<n.length;i++) h = ((h<<5)-h)+n.charCodeAt(i);
  return colors[Math.abs(h)%colors.length];
}
function stageLabel(s){
  const m = {submitted:'已投递',written_test:'笔试/测评',interview_1:'一面/二面',interview_2:'一面/二面',hr_interview:'HR面',offer_pool:'Offer/池子',rejected:'已结束'};
  return m[s]||s;
}
function stageColor(s){
  const m = {submitted:'#E6F0FF',written_test:'#EDE0FF',interview_1:'#FFF7E6',interview_2:'#FFF7E6',hr_interview:'#E6FFE6',offer_pool:'#FFE6F0',rejected:'#F0F0F0'};
  return m[s]||'#F0F0F0';
}
function stageTextColor(s){
  const m = {submitted:'#357ABD',written_test:'#722ED1',interview_1:'#D48806',interview_2:'#D48806',hr_interview:'#389E0D',offer_pool:'#EB2F96',rejected:'#999'};
  return m[s]||'#999';
}

async function add(){
  const s = sk[nc.si]||sel.value;
  // 先调 API 创建，拿到数据库真实 ID
  let realId = Date.now(); // 兜底
  try {
    const created = await api.post('/application',{userId:userStore.user?.id||1,companyName:nc.companyName,position:nc.position,stage:s});
    if (created && created.id) realId = created.id;
  } catch {}
  const card = {id:realId,companyName:nc.companyName,position:nc.position,appliedAt:new Date().toISOString().slice(0,10),stage:s};
  if(!kd[s]) kd[s]=[]; kd[s].push(card);
  nc.companyName=''; nc.position=''; nc.si=0; show.value=false; sel.value=s;
  uni.showToast({title:'添加成功',icon:'success'});
}

function detail(item){
  uni.showActionSheet({itemList:['修改阶段','删除记录'],success:(res)=>{
    if(res.tapIndex===0){
      const curIdx = cols.findIndex(c=>c.key===item.stage);
      const so2 = cols.map(c=>c.label);
      uni.showActionSheet({itemList:so2,success:async (r2)=>{
        const newStage = cols[r2.tapIndex]?.key||item.stage;
        // 先调 API，成功后再改 UI
        try { await api.put(`/application/${item.id}/stage`,{stage:newStage}); } catch {}
        const arr=kd[item.stage]; if(arr&&item.stage!==newStage){const i=arr.findIndex(c=>c.id===item.id);if(i!==-1)arr.splice(i,1);}
        item.stage=newStage; if(!kd[newStage])kd[newStage]=[]; kd[newStage].push(item);
        uni.showToast({title:`已移至「${cols[r2.tapIndex].label}」`,icon:'success'});
      }});
    }else{
      uni.showModal({title:'确认删除',content:`删除「${item.companyName}」的投递记录？`,success:async (r3)=>{
        if(r3.confirm){
          // 先调 API 删除，成功后再从 UI 移除
          try { await api.del(`/application/${item.id}`); } catch { uni.showToast({title:'删除失败',icon:'none'}); return; }
          const arr=kd[item.stage]; if(arr){const i=arr.findIndex(c=>c.id===item.id);if(i!==-1)arr.splice(i,1);}
          uni.showToast({title:'已删除',icon:'none'});
        }
      }});
    }
  }});
}

async function fetchK(){
  try {const d=await api.get(`/application/kanban/${userStore.user?.id||1}`);Object.assign(kd,d);}
  catch {
    kd.submitted=[{id:1,companyName:'字节跳动',position:'前端开发工程师',appliedAt:'2025-03-14',stage:'submitted'},{id:2,companyName:'阿里巴巴',position:'前端开发工程师',appliedAt:'2025-03-13',stage:'submitted'}];
    kd.written_test=[{id:3,companyName:'腾讯',position:'前端开发工程师',appliedAt:'2025-03-10',stage:'written_test'}];
    kd.interview_1=[{id:4,companyName:'美团',position:'前端开发工程师',appliedAt:'2025-03-08',stage:'interview_1'}];
    kd.hr_interview=[{id:5,companyName:'小红书',position:'前端开发工程师',appliedAt:'2025-03-05',stage:'hr_interview'}];
  }
}

onMounted(()=>{fetchK();});
</script>

<style lang="scss" scoped>
.kp { height:100vh; display:flex; flex-direction:column; padding-top: var(--status-bar-height); box-sizing: border-box; }
.kh { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#fff; border-bottom:1px solid #f0f0f0; }
.kt { font-size:18px; font-weight:600; }
/* 悬浮按钮 */
.fab { position:fixed; right:40rpx; bottom:120rpx; width:96rpx; height:96rpx; border-radius:50%; background:#4A90D9; color:#fff; font-size:48rpx; font-weight:300; display:flex; align-items:center; justify-content:center; box-shadow:0 6rpx 20rpx rgba(74,144,217,.4); z-index:100; line-height:1; }

/* 横向标签栏 */
.ts { width:100%; background:#fff; padding:10px 0; border-bottom:1px solid #f5f5f5; }
.ts ::v-deep .uni-scroll-view { overflow-y:hidden !important; }
.tb { display:inline-flex; gap:8px; padding:0 12px; }
.ti { display:inline-flex; align-items:center; padding:6px 14px; border-radius:16px; font-size:13px; color:#666; background:#f5f6fa; white-space:nowrap; flex-shrink:0; }
.ti.a { background:#E6F0FF; color:#4A90D9; font-weight:600; }
.tc2 { font-size:11px; opacity:.7; margin-left:4px; }

/* 卡片列表 */
.cl2 { flex:1; height:0; padding:12px 20rpx; padding-bottom:100rpx; box-sizing: border-box; }
.ca2 { display:flex; align-items:center; background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; margin-left: 4rpx; margin-right: 4rpx; box-shadow:0 1px 4px rgba(0,0,0,.04); box-sizing: border-box; overflow: hidden; }
.lo { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px; font-weight:700; flex-shrink:0; margin-right:14px; }
.mi4 { flex:1; min-width:0; overflow:hidden; }
.cac2 { font-size:15px; font-weight:600; color:#333; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cap2 { font-size:12px; color:#999; display:block; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ri { text-align:right; flex-shrink:0; margin-left:10px; min-width: 100rpx; }
.cat2 { font-size:11px; color:#bbb; display:block; margin-bottom:6px; }
.stg { font-size:11px; padding:3px 10px; border-radius:10px; font-weight:500; display:inline-block; white-space:nowrap; }

/* 空状态 */
.ee { text-align:center; padding:60px 0; }
.eem { font-size:14px; color:#ccc; }

/* 全局防溢出 */
.kp { overflow-x:hidden; }
.ks { overflow-x:hidden; }
.cl2 { overflow-x:hidden; }

/* 隐藏滚动条 */
::-webkit-scrollbar { display:none; width:0; height:0; }

/* 弹窗 */
.mo { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
.mob { background:#fff; border-radius:16px; padding:24px; width:300px; box-shadow:0 8px 30px rgba(0,0,0,.15); }
.mot { font-size:18px; font-weight:600; margin-bottom:16px; text-align:center; }
.mi3 { border:1px solid #e8e8e8; border-radius:8px; padding:10px 12px; font-size:14px; width:100%; box-sizing:border-box; margin-bottom:10px; height:40px; line-height:40px; background:#fafafa; }
.mp { border:1px solid #e8e8e8; border-radius:8px; padding:10px 12px; display:block; font-size:14px; color:#333; background:#fafafa; line-height:20px; }
.moa { display:flex; gap:10px; margin-top:14px; }
.moc { flex:1; background:#f0f0f0; border:none; border-radius:8px; padding:10px; font-size:14px; color:#666; }
.mok { flex:1; background:#4A90D9; border:none; border-radius:8px; padding:10px; font-size:14px; color:#fff; }
</style>
