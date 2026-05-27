<template>
  <view class="page">
    <view class="hero"><text class="hi">🎤</text><text class="ht">AI 模拟面试</text><text class="hd">沉浸式面试模拟，多轮深度追问</text></view>

    <view class="section"><view class="st">选择面试类型</view>
      <view class="tg">
        <view class="tc" v-for="t in types" :key="t.id" :class="{a:sel===t.id}" @click="sel=t.id">
          <text class="ti">{{t.icon}}</text><text class="tn">{{t.name}}</text><text class="td">{{t.desc}}</text>
        </view>
      </view>
    </view>

    <view class="section"><view class="st">应聘岗位</view>
      <input class="inp" v-model="pos" placeholder="如：前端开发工程师" />
    </view>

    <button class="sb" :disabled="!pos" @click="start">开始面试</button>

    <view class="section" v-if="history.length">
      <view class="st">📋 历史记录</view>
      <view class="hi" v-for="h in history" :key="h.id" @click="goDetail(h)">
        <text class="hty">{{tl(h.interviewType)}}</text><text class="hp">{{h.targetPosition}}</text>
        <text :class="'hs '+sc(h.score)">{{h.score}}分</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import api from '@/api/request';

const userStore = useUserStore();
const sel = ref('tech');
const pos = ref('');
const history = ref([]);

const types = [
  {id:'tech',name:'技术初面',icon:'💻',desc:'技术深度考察'},
  {id:'hr',name:'HR 终面',icon:'🤝',desc:'综合素质评估'},
  {id:'pressure',name:'压力面试',icon:'⚡',desc:'高强度追问'}
];

function tl(t){ return {tech:'技术',hr:'HR',pressure:'压力'}[t]||t; }
function sc(s){ return s>=80?'h':s>=60?'m':'l'; }

async function start() {
  if(!pos.value){ uni.showToast({title:'请填写岗位',icon:'none'}); return; }
  uni.showLoading({title:'启动中'});
  try {
    const d = await api.post('/interview/start',{userId:userStore.user?.id||1,interviewType:sel.value,targetPosition:pos.value});
    uni.hideLoading();
    uni.navigateTo({url:`/pages/interview/chat?sessionId=${d.sessionId}&type=${sel.value}&position=${pos.value}&greeting=${encodeURIComponent(d.greeting)}`});
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: '启动失败：' + (err.message || '请检查后端'), icon: 'none', duration: 3000 });
  }
}

function goDetail(h){ uni.navigateTo({url:`/pages/question/detail?sessionId=${h.sessionId}`}); }

onMounted(async ()=>{
  try{ history.value = await api.get(`/interview/history/${userStore.user?.id||1}`); } catch {
    history.value = [{id:1,sessionId:'m1',interviewType:'tech',targetPosition:'前端开发',score:78},{id:2,sessionId:'m2',interviewType:'hr',targetPosition:'前端开发',score:85}];
  }
  if(userStore.user?.targetPosition) pos.value = userStore.user.targetPosition;
});
</script>

<style lang="scss" scoped>
.page { padding:16px; padding-bottom:80px; }
.hero { text-align:center; padding:32px 0 20px; }
.hi { font-size:48px; }
.ht { font-size:22px; font-weight:700; display:block; margin:8px 0; }
.hd { font-size:14px; color:#999; }
.section { margin-bottom:20px; }
.st { font-size:15px; font-weight:600; margin-bottom:12px; }
.tg { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.tc { background:#fff; border:2px solid #eee; border-radius:12px; padding:16px 10px; text-align:center; }
.tc.a { border-color:#4A90D9; background:#f0f7ff; }
.ti { font-size:28px; display:block; }
.tn { font-size:14px; font-weight:600; display:block; margin:6px 0 4px; }
.td { font-size:11px; color:#999; display:block; }
.inp { background:#fff; border:1px solid #e8e8e8; border-radius:8px; padding:14px 16px; font-size:15px; width:100%; box-sizing:border-box; }
.sb { background:linear-gradient(135deg,#4A90D9,#357ABD); color:#fff; border:none; border-radius:12px; padding:16px; font-size:17px; font-weight:600; width:100%; margin:8px 0 24px; }
.sb[disabled]{ opacity:0.5; }
.hi { display:flex; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0; background:#fff; border-radius:12px; padding:12px 16px; margin-bottom:8px; }
.hi:last-child { border-bottom:none; margin-bottom:0; }
.hty { background:#f0f7ff; color:#4A90D9; font-size:12px; padding:2px 8px; border-radius:4px; margin-right:10px; }
.hp { flex:1; font-size:14px; }
.hs { font-size:14px; font-weight:600; }
.h { color:#52C41A; } .m { color:#FAAD14; } .l { color:#FF4D4F; }
</style>
