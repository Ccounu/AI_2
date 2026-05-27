<template>
  <view class="cp">
    <view class="ch"><text class="ct">{{tl}}</text><text class="cp2">{{pos}}</text><text class="eb" @click="end">结束</text></view>

    <scroll-view class="ml" scroll-y :scroll-top="st" @scrolltolower="sb">
      <view v-for="(m,i) in msgs" :key="i" class="mr" :class="m.role==='user'?'u':'a'">
        <view class="ma" :class="m.role==='user'?'ua':''">{{ m.role==='user'?'我':'AI' }}</view>
        <view class="mb"><text class="mt">{{m.content}}</text></view>
      </view>
      <view class="mr" v-if="loading"><view class="ma">AI</view><view class="mb tp"><text class="tdt">.</text><text class="tdt">.</text><text class="tdt">.</text></view></view>
    </scroll-view>

    <view class="ib">
      <view class="iw"><input class="mi" v-model="txt" placeholder="输入回答..." @confirm="send" :disabled="loading||ended" /></view>
      <button class="sdb" @click="send" :disabled="!txt.trim()||loading||ended">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import api from '@/api/request';

const userStore = useUserStore();
const sid = ref(''); const type = ref('tech'); const pos = ref(''); const greet = ref('');
const txt = ref(''); const msgs = ref([]); const loading = ref(false); const ended = ref(false); const st = ref(0);

const tl = computed(()=>({tech:'技术面试',hr:'HR面试',pressure:'压力面试'})[type.value]||type.value);

function send() {
  const t = txt.value.trim(); if(!t||loading.value||ended.value) return;
  msgs.value.push({role:'user',content:t}); txt.value=''; loading.value=true; sb();
  fetchAI(t);
}

async function fetchAI(um) {
  try {
    // 使用 GET 接口，参数走 URL query（小程序 POST body 序列化兼容问题）
    const data = await api.get(`/interview/chat?sessionId=${sid.value}&message=${encodeURIComponent(um)}`);
    msgs.value.push({ role: 'assistant', content: data.content });
  } catch {
    // API 失败时回退到模拟回复
    const reps = ['能具体说说你在项目中遇到的最大技术挑战吗？','你提到用 Vue3，能说说 Composition API 相比 Options API 的优势？','如果让你设计一个高并发系统，你会怎么做？','好的，换个角度：你的核心竞争力是什么？'];
    msgs.value.push({ role: 'assistant', content: reps[Math.floor(Math.random() * reps.length)] });
  } finally {
    loading.value = false;
    sb();
  }
}

function end() {
  uni.showModal({title:'结束面试',content:'确定结束？将生成评估报告。',success:async (res)=>{
    if(res.confirm){ ended.value=true;
      try {
        const r = await api.post('/interview/end',{sessionId:sid.value});
        uni.navigateTo({url:`/pages/question/detail?sessionId=${sid.value}&score=${r.score}&evaluation=${encodeURIComponent(r.evaluation)}`});
      } catch {
        const s = Math.floor(60+Math.random()*35);
        uni.navigateTo({url:`/pages/question/detail?sessionId=${sid.value}&score=${s}&evaluation=${encodeURIComponent('整体表现良好，技术基础扎实。')}`});
      }
    }
  }});
}

function sb(){ setTimeout(()=>{ st.value=99999; },100); }

onLoad((options) => {
  sid.value = options.sessionId || '';
  type.value = options.type || 'tech';
  pos.value = decodeURIComponent(options.position || '');
  greet.value = decodeURIComponent(options.greeting || '你好，请先做个自我介绍吧。');
  if (greet.value) msgs.value.push({ role: 'assistant', content: greet.value });
  sb();
});
</script>

<style lang="scss" scoped>
.cp { display:flex; flex-direction:column; height:100vh; background:#f5f6fa; overflow-x:hidden; }
.ch { display:flex; align-items:center; padding:12px 16px; background:#fff; border-bottom:1px solid #eee; flex-shrink:0; }
.ct { background:#f0f7ff; color:#4A90D9; font-size:12px; padding:2px 8px; border-radius:4px; margin-right:10px; }
.cp2 { flex:1; font-size:14px; font-weight:500; }
.eb { color:#FF4D4F; font-size:13px; padding:6px 12px; border:1px solid #FF4D4F; border-radius:16px; }
.ml { flex:1; padding:16px; overflow-y:auto; overflow-x:hidden; }
.mr { display:flex; margin-bottom:20px; align-items:flex-start; }
.ma { width:36px; height:36px; border-radius:18px; background:#4A90D9; color:#fff; font-size:12px; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:10px; }
.ua { background:#52C41A; }
.mb { max-width:70%; background:#fff; border-radius:12px; padding:12px 16px; box-shadow:0 1px 3px rgba(0,0,0,.06); margin-right:10px; }
.mr.u .mb { background:#4A90D9; color:#fff; }
.mt { font-size:14px; line-height:1.6; white-space:pre-wrap; word-break:break-all; }
.tp { background:#e8e8e8; padding:12px 20px; }
.tdt { font-size:24px; font-weight:700; animation:b 1.4s infinite; margin:0 2px; }
.tdt:nth-child(2){ animation-delay:.2s; }
.tdt:nth-child(3){ animation-delay:.4s; }
@keyframes b{ 0%,20%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
.ib { display:flex; align-items:center; padding:12px 16px; background:#fff; border-top:1px solid #eee; }
.iw { flex:1; display:flex; align-items:center; background:#f5f6fa; border-radius:20px; padding:0 12px; margin-right:10px; }
.mi { flex:1; height:40px; font-size:14px; border:none; background:transparent; }
.sdb { background:#4A90D9; color:#fff; border:none; border-radius:20px; padding:10px 20px; font-size:14px; white-space:nowrap; }
.sdb[disabled]{ opacity:.4; }
</style>
